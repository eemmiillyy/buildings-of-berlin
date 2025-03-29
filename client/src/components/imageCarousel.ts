import Swiper from 'swiper';
import { Navigation, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

export class ImageCarousel {
    private modal: HTMLElement;
    private swiper: Swiper | null = null;

    constructor() {
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
    }

    private createModal(): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'image-carousel-modal';
        
        const container = document.createElement('div');
        container.className = 'swiper';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'carousel-close';
        
        const prevBtn = document.createElement('div');
        prevBtn.className = 'swiper-button-prev';
        
        const nextBtn = document.createElement('div');
        nextBtn.className = 'swiper-button-next';
        
        container.appendChild(wrapper);
        container.appendChild(prevBtn);
        container.appendChild(nextBtn);
        modal.appendChild(container);
        modal.appendChild(closeBtn);
        
        closeBtn.onclick = () => this.hide();
        modal.onclick = (e) => {
            if (e.target === modal) this.hide();
        };

        return modal;
    }

    public show(images: HTMLImageElement[], startIndex: number = 0): void {
        const wrapper = this.modal.querySelector('.swiper-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';
        
        // Create slides from the actual image elements
        images.forEach(img => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            const zoomContainer = document.createElement('div');
            zoomContainer.className = 'swiper-zoom-container';
            
            // Clone the image to avoid moving it from the popup
            const clonedImg = img.cloneNode(true) as HTMLImageElement;
            
            zoomContainer.appendChild(clonedImg);
            slide.appendChild(zoomContainer);
            wrapper.appendChild(slide);
        });

        this.modal.style.display = 'flex';
        
        if (this.swiper) {
            this.swiper.destroy();
        }

        this.swiper = new Swiper('.swiper', {
            modules: [Navigation, Zoom],
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            zoom: {
                maxRatio: 3,
            },
            initialSlide: startIndex,  // Start at the clicked image
            loop: true,
        });
    }

    public hide(): void {
        this.modal.style.display = 'none';
    }
} 