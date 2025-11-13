import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { PaperPreset } from './imageEditSlice'; // Import PaperPreset type

/** You can enhance this type further as your app grows */
export interface ManipulationHistory {
    description?: string; // e.g. "Cropped", "Grid changed", etc
    timestamp: number;
    params?: Record<string, any>; // can be detailed object
}

/** Project entity for history page - Updated to match storage structure */
export interface Project {
    // Core project identifiers
    id: string;
    name: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string

    // Image data
    imageUri: string;
    paperPreset: PaperPreset;
    realWorldWidth: number;
    realWorldHeight: number;

    // Image metadata
    imageData: {
        width: number;
        height: number;
        format: string;
        fileSize?: number;
        source?: 'camera' | 'gallery';
        mimeType?: string;
        fileName?: string;
    };

    // Edit state
    editState?: {
        strokeWidth: number;
        strokeColor: string;
        showLabels: boolean;
        labelStyle?: string;
        imageEffect: string;
        gridMode?: 'default' | 'advanced';
        gridCellWidth?: number;
        gridCellHeight?: number;
        // Add other edit states as needed
    };

    // History and UI properties
    manipulations?: ManipulationHistory[]; // Made optional with ?
    thumbnailUri?: string; // optional thumbnail for performance/speed
    isFavorite?: boolean; // user can favorite/star a project
}

export interface ProjectState {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    selectedProjectId: string | null;
}

const initialState: ProjectState = {
    projects: [],
    isLoading: false,
    error: null,
    selectedProjectId: null,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        // Project management
        addProject: (state, action: PayloadAction<Project>) => {
            state.projects.unshift(action.payload); // latest first
            state.selectedProjectId = action.payload.id;
        },

        updateProject: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
            const index = state.projects.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.projects[index] = {
                    ...state.projects[index],
                    ...action.payload,
                    updatedAt: new Date().toISOString()
                };
            }
        },

        deleteProject: (state, action: PayloadAction<string>) => {
            state.projects = state.projects.filter(p => p.id !== action.payload);
            if (state.selectedProjectId === action.payload) {
                state.selectedProjectId = null;
            }
        },

        clearProjects: (state) => {
            state.projects = [];
            state.selectedProjectId = null;
        },

        // Project selection
        selectProject: (state, action: PayloadAction<string>) => {
            state.selectedProjectId = action.payload;
        },

        clearSelectedProject: (state) => {
            state.selectedProjectId = null;
        },

        // Favorites
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const proj = state.projects.find(p => p.id === action.payload);
            if (proj) {
                proj.isFavorite = !proj.isFavorite;
                proj.updatedAt = new Date().toISOString();
            }
        },

        // Manipulation history
        addManipulation: (state, action: PayloadAction<{ id: string; manipulation: ManipulationHistory }>) => {
            const proj = state.projects.find(p => p.id === action.payload.id);
            if (proj) {
                proj.manipulations = proj.manipulations || [];
                proj.manipulations.push(action.payload.manipulation);
                proj.updatedAt = new Date().toISOString();
            }
        },

        clearManipulations: (state, action: PayloadAction<string>) => {
            const proj = state.projects.find(p => p.id === action.payload);
            if (proj) {
                proj.manipulations = [];
                proj.updatedAt = new Date().toISOString();
            }
        },

        // Bulk operations
        setProjects: (state, action: PayloadAction<Project[]>) => {
            state.projects = action.payload;
        },

        // Loading states
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        // Project reordering (for manual sorting)
        reorderProjects: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
            const { fromIndex, toIndex } = action.payload;
            const [movedProject] = state.projects.splice(fromIndex, 1);
            state.projects.splice(toIndex, 0, movedProject);
        },

        // Update project name
        updateProjectName: (state, action: PayloadAction<{ id: string; name: string }>) => {
            const proj = state.projects.find(p => p.id === action.payload.id);
            if (proj) {
                proj.name = action.payload.name;
                proj.updatedAt = new Date().toISOString();
            }
        },

        // Update thumbnail
        updateThumbnail: (state, action: PayloadAction<{ id: string; thumbnailUri: string }>) => {
            const proj = state.projects.find(p => p.id === action.payload.id);
            if (proj) {
                proj.thumbnailUri = action.payload.thumbnailUri;
                proj.updatedAt = new Date().toISOString();
            }
        },

        // Import/export operations
        importProjects: (state, action: PayloadAction<Project[]>) => {
            // Merge imported projects, avoiding duplicates by ID
            const existingIds = new Set(state.projects.map(p => p.id));
            const newProjects = action.payload.filter(project => !existingIds.has(project.id));
            state.projects = [...newProjects, ...state.projects];
        },

        // Duplicate project
        duplicateProject: (state, action: PayloadAction<{ id: string; newId: string; newName?: string }>) => {
            const originalProject = state.projects.find(p => p.id === action.payload.id);
            if (originalProject) {
                const duplicatedProject: Project = {
                    ...originalProject,
                    id: action.payload.newId,
                    name: action.payload.newName || `${originalProject.name} (Copy)`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    manipulations: [], // Start with empty manipulation history
                    isFavorite: false, // Reset favorite status
                };
                state.projects.unshift(duplicatedProject);
            }
        },
    },
});

export const {
    addProject,
    updateProject,
    deleteProject,
    clearProjects,
    selectProject,
    clearSelectedProject,
    toggleFavorite,
    addManipulation,
    clearManipulations,
    setProjects,
    setLoading,
    setError,
    reorderProjects,
    updateProjectName,
    updateThumbnail,
    importProjects,
    duplicateProject,
} = projectSlice.actions;

// Selectors
export const selectAllProjects = (state: { project: ProjectState }) => state.project.projects;
export const selectFavoriteProjects = (state: { project: ProjectState }) =>
    state.project.projects.filter(project => project.isFavorite);
export const selectProjectById = (state: { project: ProjectState }, id: string) =>
    state.project.projects.find(project => project.id === id);
export const selectSelectedProject = (state: { project: ProjectState }) =>
    state.project.selectedProjectId ? state.project.projects.find(p => p.id === state.project.selectedProjectId) : null;
export const selectProjectsByPaperSize = (state: { project: ProjectState }, paperPreset: PaperPreset) =>
    state.project.projects.filter(project => project.paperPreset === paperPreset);
export const selectRecentProjects = (state: { project: ProjectState }, limit: number = 10) =>
    [...state.project.projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);

export const selectIsLoading = (state: { project: ProjectState }) => state.project.isLoading;
export const selectError = (state: { project: ProjectState }) => state.project.error;
export const selectSelectedProjectId = (state: { project: ProjectState }) => state.project.selectedProjectId;

export default projectSlice.reducer;