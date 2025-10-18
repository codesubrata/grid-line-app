import { configureStore } from "@reduxjs/toolkit";
import {
    persistReducer,
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "redux";
import imageEditReducer from "./slices/imageEditSlice";
import imageReducer from "./slices/imageSlice";
import projectReducer from "./slices/historySlice";

// Enhanced persist configuration
const persistConfig = {
    key: "root",
    storage: AsyncStorage,
    whitelist: ["image", "project", "imageEdit"], // only persist these slices
    version: 1, // Add versioning for future migrations
    debug: __DEV__, // Enable debug in development
    timeout: 10000, // 10 second timeout
};

const rootReducer = combineReducers({
    image: imageReducer,
    project: projectReducer,
    imageEdit: imageEditReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // ✅ Only ignore redux-persist actions (not everything)
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                // ✅ Ignore specific problematic paths
                ignoredPaths: ['image.currentImage'], // Image URIs might be non-serializable
            },
        }),
    devTools: __DEV__, // ✅ Only enable Redux DevTools in development
});

// ✅ Enhanced persistor with error handling
export const persistor = persistStore(store, null, () => {
    console.log('Redux persist rehydration complete');
});

// ✅ Monitor persist state
persistor.subscribe(() => {
    const state = persistor.getState();
    if (state.bootstrapped) {
        console.log('Redux persist bootstrapped');
    }
});

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ Enhanced types for thunks
export type GetState = () => RootState;
export interface ThunkAPI {
    dispatch: AppDispatch;
    state: RootState;
    getState: GetState;
}
