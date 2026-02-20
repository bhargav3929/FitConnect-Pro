import { useState, useEffect } from 'react';
import { ClassSession } from '@/types/class';

// Mock class schedule for the single FitConnect Pro facility
const MOCK_CLASSES: ClassSession[] = [
    {
        id: '101',
        trainerId: 't1',
        date: new Date(new Date().setHours(6, 0, 0, 0)),
        startTime: '06:00',
        duration: 45,
        capacity: 20,
        bookedCount: 12,
        classType: 'HIIT',
        difficultyLevel: 'advanced',
        equipmentNeeded: 'Dumbbells, Towel',
        description: 'High Intensity Interval Training to torch calories and build endurance.',
        status: 'scheduled',
        location: 'Performance Floor',
        intensityLevel: 3,
        totalSpots: 20,
        bookedSpots: [1, 2, 3, 5, 6, 8, 9, 11, 13, 15, 17, 19],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '102',
        trainerId: 't2',
        date: new Date(new Date().setHours(7, 30, 0, 0)),
        startTime: '07:30',
        duration: 60,
        capacity: 15,
        bookedCount: 15,
        classType: 'Yoga',
        difficultyLevel: 'intermediate',
        equipmentNeeded: 'Yoga Mat',
        description: 'Vinyasa flow to restore balance and flexibility.',
        status: 'scheduled',
        location: 'Heated Yoga Studio',
        intensityLevel: 1,
        totalSpots: 15,
        bookedSpots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '103',
        trainerId: 't3',
        date: new Date(new Date().setHours(9, 0, 0, 0)),
        startTime: '09:00',
        duration: 50,
        capacity: 25,
        bookedCount: 8,
        classType: 'Spin',
        difficultyLevel: 'beginner',
        equipmentNeeded: 'Cycling Shoes (available at front desk)',
        description: 'Rhythm-based cycling session to start your day right.',
        status: 'scheduled',
        location: 'Cycling Theater',
        intensityLevel: 2,
        totalSpots: 25,
        bookedSpots: [1, 4, 7, 10, 13, 16, 19, 22],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '104',
        trainerId: 't1',
        date: new Date(new Date().setHours(12, 0, 0, 0)),
        startTime: '12:00',
        duration: 30,
        capacity: 12,
        bookedCount: 6,
        classType: 'Strength',
        difficultyLevel: 'intermediate',
        equipmentNeeded: 'Barbell, Weight Plates',
        description: 'Focused strength training with Olympic lifting fundamentals.',
        status: 'scheduled',
        location: 'Olympic Lifting Platform',
        intensityLevel: 3,
        totalSpots: 12,
        bookedSpots: [2, 4, 6, 8, 10, 12],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '105',
        trainerId: 't2',
        date: new Date(new Date().setHours(17, 30, 0, 0)),
        startTime: '17:30',
        duration: 45,
        capacity: 18,
        bookedCount: 14,
        classType: 'Pilates',
        difficultyLevel: 'beginner',
        equipmentNeeded: 'Reformer (provided)',
        description: 'Core-focused Pilates on reformer machines for all levels.',
        status: 'scheduled',
        location: 'Private Training Suite A',
        intensityLevel: 1,
        totalSpots: 18,
        bookedSpots: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 15, 16, 18],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '106',
        trainerId: 't3',
        date: new Date(new Date().setHours(18, 30, 0, 0)),
        startTime: '18:30',
        duration: 45,
        capacity: 20,
        bookedCount: 18,
        classType: 'Boxing',
        difficultyLevel: 'advanced',
        equipmentNeeded: 'Boxing Gloves, Hand Wraps (provided)',
        description: 'High-energy boxing workout combining cardio and technique.',
        status: 'scheduled',
        location: 'Performance Floor',
        intensityLevel: 3,
        totalSpots: 20,
        bookedSpots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export function useClasses() {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setClasses(MOCK_CLASSES);
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return { classes, loading };
}
