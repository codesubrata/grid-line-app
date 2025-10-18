import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabsLayOut() {
  return (
    <Tabs
      initialRouteName='grid'
      backBehavior='history'
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FF3008',
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center"
        },
        tabBarStyle: {
          backgroundColor: "#0f0D23",
          marginHorizontal: 10,
          marginBottom: 10,
          borderRadius: 50,
          position: "absolute",
          height: 52,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: "#0f0D23",
        },

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false, title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),

        }}
      />

      <Tabs.Screen
        name="edit"
        options={{
          headerShown: false,
          title: 'Edit',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'create-sharp' : 'create-outline'} color={color} size={24} />
          ),
        }} />
      <Tabs.Screen
        name="grid"
        options={{
          headerShown: false, title: 'Grid',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid-sharp' : 'grid-outline'} color={color} size={24} />
          ),
        }} />
      <Tabs.Screen
        name="history"
        options={{
          headerShown: false,
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time-sharp' : 'time-outline'} color={color} size={24} />
          ),
        }} />
    </Tabs>
  )
}

