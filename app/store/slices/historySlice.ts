import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Project {
    id: string;
    imageUri: string;
    manipulations: any; // you can refine this type later
    createdAt: number;
}

interface ProjectState {
    projects: Project[];
}

const initialState: ProjectState = {
    projects: [],
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        addProject: (state, action: PayloadAction<Project>) => {
            state.projects.unshift(action.payload); // latest first
        },
        updateProject: (state, action: PayloadAction<Project>) => {
            const index = state.projects.findIndex(p => p.id === action.payload.id);
            if (index !== -1) state.projects[index] = action.payload;
        },
        deleteProject: (state, action: PayloadAction<string>) => {
            state.projects = state.projects.filter(p => p.id !== action.payload);
        },
    },
});

export const { addProject, updateProject, deleteProject } = projectSlice.actions;
export default projectSlice.reducer;
