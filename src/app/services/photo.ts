import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CameraPhoto } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { LocationService } from './location';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos'; //toca aplicar una 'clave' para guardar 

  constructor(private locationService: LocationService) { }

  public async addNewToGallery() {
    try {
      await this.locationService.ensurePermissions();
      const position = await this.locationService.getCurrentPosition();
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100
      });

      const savedImageFile = await this.savePicture(capturedPhoto, position.coords.latitude, position.coords.longitude);
      this.photos.unshift(savedImageFile);

      await Preferences.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos)
      });

      console.log('Foto capturada y guardada:', savedImageFile);
      return savedImageFile;
    } catch (error) {
      console.error('Error al capturar foto con ubicación:', error);
      throw error;
    }
  }


  public async loadSaved() {
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    for (let photo of this.photos) {
      try {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      } catch (error) {
        console.error('Error al leer la foto guardada:', error);
      }
    }

    console.log('Fotos cargadas desde almacenamiento:', this.photos);
  }

  private async savePicture(photo: CameraPhoto, latitude?: number, longitude?: number) {
    const base64Data = await this.readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    const timestamp = new Date().toISOString();
    const googleMapsLink = latitude && longitude ?
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : undefined;

    return {
      filepath: fileName,
      webviewPath: photo.webPath,
      latitude,
      longitude,
      timestamp,
      googleMapsLink
    };
  }

  // Esto convierte la foto a base64
  private async readAsBase64(photo: CameraPhoto) {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  //ahora convertir un Blob a base64
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  // Método para obtener las últimas fotos con ubicación
  public getPhotosWithLocation(limit: number = 3): UserPhoto[] {
    return this.photos
      .filter(photo => photo.latitude && photo.longitude)
      .slice(0, limit);
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  googleMapsLink?: string;
}
