import * as fs from 'fs';
import * as path from 'path';
import apiClient from '../services/apiClient';

const buildingId = "f8ba8f15-6f36-43d1-bbc1-d1951726b7df";
const pathToImages = "./images";


export const convertFileToBase64 = (filePath: string): Promise<{ imageData: string }> => {
    return new Promise((resolve, reject) => {
      try {
        const data = fs.readFileSync(filePath);
        const base64String = `data:image/${path.extname(filePath).slice(1)};base64,${Buffer.from(data).toString('base64')}`;
        resolve({ imageData: base64String });
      } catch (error) {
        reject(error);
      }
    });
  };

async function uploadImageToNetlify(filePath: string): Promise<string> {
    const formData = await convertFileToBase64(filePath)
    const response = await apiClient.post('/upload/image', formData.imageData);
    return response.data.filename;
}

async function updateBuildingWithImage(buildingId: string, imageUrls: string[]) {
    const response = await apiClient.patch(`/buildings/${buildingId}`, {
        images: imageUrls
    });
    return response.data;
}

async function main() {
    try {
        // Read all files from the folder
        const files = fs.readdirSync(pathToImages)
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .map(file => path.join(pathToImages, file));

        if (files.length === 0) {
            throw new Error('No image files found in the specified folder');
        }

        // Upload all images to Netlify
        console.log('Uploading images to Netlify...');
        const imageFilenames = await Promise.all(
            files.map(file => uploadImageToNetlify(file))
        );
        console.log('Images uploaded successfully:', imageFilenames);

        // Update building with all image filenames
        console.log('Updating building record...');
        const building = await updateBuildingWithImage(buildingId, imageFilenames);
        console.log('Building updated successfully:', building);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();