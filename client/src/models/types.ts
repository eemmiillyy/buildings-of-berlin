import { Mood } from "../utils";

export interface ServerStatus {
    status: string;
}

export interface ServerMessage {
    message: string;
}

export interface EchoRequest {
    message: string;
}

export interface EchoResponse {
    echo: string;
}

export interface ImpressionItem {
    id: string;
    buildingId: string;
    content: string;
    photos: string[];
    hyperlinks: string[];
    moods: Mood[],
    createdAt: string;
}

export interface BuildingItem {
    id: string;
    title: string;
    designer: string;
    year: string;
    neighbourhood: string;
    era: string;
    xcoordinate: number;
    ycoordinate: number;
    createdAt: string;
}

export interface DraggableItem {
    id: string;
    title: string;
    content: string;
    xcoordinate: number;
    ycoordinate: number;
} 