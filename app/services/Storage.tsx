// app/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Project } from '../store/slices/historySlice';

const PROJECT_LIST_KEY = 'PROJECT_LIST_V2';
const MAX_PROJECTS = 50; // Prevent unlimited growth

/** Fetch the list of all project summaries */
export const getProjectList = async (): Promise<Project[]> => {
    try {
        const json = await AsyncStorage.getItem(PROJECT_LIST_KEY);
        if (!json) return [];
        return JSON.parse(json);
    } catch (error) {
        console.error('Error reading project list:', error);
        return [];
    }
};

/** Fetch a single project (with all details) by ID */
export const getProject = async (projectId: string): Promise<Project | null> => {
    try {
        const key = `project:${projectId}`;
        const json = await AsyncStorage.getItem(key);
        if (!json) return null;
        return JSON.parse(json);
    } catch (error) {
        console.error(`Error reading project ${projectId}:`, error);
        return null;
    }
};

/** Save (create or update) a project (full data, details) */
export const saveProject = async (project: Project): Promise<boolean> => {
    try {
        // Save project detail
        const key = `project:${project.id}`;
        await AsyncStorage.setItem(key, JSON.stringify(project));

        // Update the summary list
        const projects = await getProjectList();
        const existingIndex = projects.findIndex(p => p.id === project.id);

        if (existingIndex === -1) {
            // Add new project at the beginning
            projects.unshift(project);
            // Limit the number of stored projects
            if (projects.length > MAX_PROJECTS) {
                const oldestProject = projects.pop();
                if (oldestProject) {
                    await AsyncStorage.removeItem(`project:${oldestProject.id}`);
                }
            }
        } else {
            // Update existing project
            projects[existingIndex] = project;
        }

        await AsyncStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        return false;
    }
};

/** Delete project */
export const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
        // Remove the project details
        await AsyncStorage.removeItem(`project:${projectId}`);

        // Remove from list
        const projects = await getProjectList();
        const newProjects = projects.filter(p => p.id !== projectId);
        await AsyncStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(newProjects));

        return true;
    } catch (error) {
        console.error(`Error deleting project ${projectId}:`, error);
        return false;
    }
};

/** Clear all projects (use carefully!) */
export const clearAllProjects = async (): Promise<boolean> => {
    try {
        const projects = await getProjectList();

        // Remove all individual project records
        const removalPromises = projects.map(p =>
            AsyncStorage.removeItem(`project:${p.id}`)
        );

        await Promise.all(removalPromises);
        await AsyncStorage.removeItem(PROJECT_LIST_KEY);

        return true;
    } catch (error) {
        console.error('Error clearing all projects:', error);
        return false;
    }
};

/** Get total storage size (optional - for debugging) */
export const getStorageInfo = async (): Promise<{
    totalProjects: number;
    projectIds: string[];
}> => {
    const projects = await getProjectList();
    return {
        totalProjects: projects.length,
        projectIds: projects.map(p => p.id)
    };
};

/** Backup projects to a string (for export functionality) */
export const exportProjects = async (): Promise<string> => {
    const projects = await getProjectList();
    const projectDetails = await Promise.all(
        projects.map(project => getProject(project.id))
    );
    return JSON.stringify(projectDetails.filter(Boolean));
};

/** Import projects from backup string */
export const importProjects = async (backupData: string): Promise<boolean> => {
    try {
        const projects: Project[] = JSON.parse(backupData);
        for (const project of projects) {
            await saveProject(project);
        }
        return true;
    } catch (error) {
        console.error('Error importing projects:', error);
        return false;
    }
};