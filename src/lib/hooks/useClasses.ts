import { useState, useEffect } from 'react';
import { ClassSession } from '@/types/class';

// Mock Data for Phase 1
const MOCK_CLASSES: ClassSession[] = [
    {
        id: '101',
        gymCenterId: '1',
        trainerId: 't1',
        date: new Date(new Date().setHours(18, 0, 0, 0)), // Today 6 PM
        startTime: '18:00',
        duration: 45,
        capacity: 20,
        bookedCount: 15,
        classType: 'HIIT',
        difficultyLevel: 'advanced',
        equipmentNeeded: 'Dumbbells, Towel',
        description: 'High Intensity Interval Training to burn calories fast.',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '102',
        gymCenterId: '1',
        trainerId: 't2',
        date: new Date(new Date().setHours(19, 0, 0, 0)), // Today 7 PM
        startTime: '19:00',
        duration: 60,
        capacity: 15,
        bookedCount: 15, // FULL
        classType: 'Yoga',
        difficultyLevel: 'intermediate',
        equipmentNeeded: 'Yoga Mat',
        description: 'Vinyasa flow to restore balance and flexibility.',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '103',
        gymCenterId: '2', // Other gym
        trainerId: 't3',
        date: new Date(new Date().setHours(7, 0, 0, 0)), // Tomorrow 7 AM
        startTime: '07:00',
        duration: 50,
        capacity: 25,
        bookedCount: 5,
        classType: 'Spin',
        difficultyLevel: 'beginner',
        equipmentNeeded: 'Cycling Shoes',
        description: 'Morning ride to start your day right.',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export function useClasses(gymId?: string) {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (gymId) {
                setClasses(MOCK_CLASSES.filter(c => c.gymCenterId === gymId));
            } else {
                setClasses(MOCK_CLASSES);
            }
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [gymId]);

    return { classes, loading };
}
