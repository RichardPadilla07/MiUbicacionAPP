import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonImg, IonItem, IonLabel } from '@ionic/angular/standalone';
import { NgIf, NgFor } from '@angular/common';
import { LocationService } from '../services/location';
import { PhotoService, UserPhoto } from '../services/photo';

@Component({
  selector: 'Tab1Page',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, NgIf, NgFor, IonFab, IonFabButton, IonIcon, IonBadge,
    IonGrid, IonRow, IonCol, IonImg, IonItem, IonLabel
  ],
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss']
})

export class Tab1Page implements OnInit, OnDestroy {
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  watchId: string | null = null;
  errorMsg = signal<string | null>(null);
  mostrarHistorial = false;
  fotosConUbicacion: UserPhoto[] = [];

  mostrarUbicacionActual() {
    this.obtenerUbicacionActual();
  }

  constructor(private loc: LocationService, private photoService: PhotoService) { }

  async ngOnInit() {
    await this.loc.ensurePermissions();
    await this.obtenerUbicacionActual();
    await this.iniciarSeguimiento();
  }

  async ionViewWillEnter() {
    if (this.mostrarHistorial) {
      await this.cargarHistorialFotos();
    }
  }

  async obtenerUbicacionActual() {
    try {
      const pos = await this.loc.getCurrentPosition();
      this.latitude.set(pos.coords.latitude);
      this.longitude.set(pos.coords.longitude);
      this.errorMsg.set(null);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'Error al obtener la ubicación actual');
    }
  }

  async iniciarSeguimiento() {
    try {
      this.watchId = await this.loc.watchPosition((pos) => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
      }, (err) => {
        this.errorMsg.set(err?.message ?? 'Error en seguimiento de ubicación');
      });
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo iniciar el seguimiento');
    }
  }

  async detenerSeguimiento() {
    if (this.watchId) {
      await this.loc.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  verHistorial() {
    this.mostrarHistorial = !this.mostrarHistorial;
    if (this.mostrarHistorial) {
      this.cargarHistorialFotos();
    }
  }

  async cargarHistorialFotos() {
    try {
      await this.photoService.loadSaved();
      this.fotosConUbicacion = this.photoService.getPhotosWithLocation(5);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  abrirEnGoogleMaps(foto: UserPhoto) {
    if (foto.googleMapsLink) {
      window.open(foto.googleMapsLink, '_blank');
    }
  }

  ngOnDestroy() {
    if (this.watchId) this.loc.clearWatch(this.watchId);
  }
}