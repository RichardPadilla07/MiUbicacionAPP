import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { PhotoService } from '../services/photo';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  constructor(public photoService: PhotoService) { }

  async ionViewWillEnter() {
    await this.photoService.loadSaved();
  }

  async addPhotoToGallery() {
    await this.photoService.addNewToGallery();
    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  }

  private scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(500);
    }
  }
}