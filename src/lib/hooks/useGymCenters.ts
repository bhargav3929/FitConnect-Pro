import { useState, useEffect } from 'react';
import { GymCenter } from '@/types/gym';

// Mock Data for Phase 1 Design Review
const MOCK_GYMS: GymCenter[] = [
    {
        id: '1',
        name: 'Equinox Hudson Yards',
        address: {
            street: '32 Hudson Yards',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
        },
        coordinates: { lat: 40.7538, lng: -74.0022 },
        contactInfo: { phone: '212-555-0199', email: 'hudsonyards@equinox.com' },
        operatingHours: {
            monday: { open: '05:30', close: '23:00' }
        },
        facilities: 'Rooftop Pool, heated yoga studio, precision run zone, cryotherapy.',
        photos: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1469&auto=format&fit=crop'
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        name: 'Barry\'s Bootcamp Chelsea',
        address: {
            street: '135 W 20th St',
            city: 'New York',
            state: 'NY',
            zip: '10011',
            country: 'USA'
        },
        coordinates: { lat: 40.7410, lng: -73.9962 },
        contactInfo: { phone: '646-555-0100', email: 'chelsea@barrys.com' },
        operatingHours: {
            monday: { open: '06:00', close: '22:00' }
        },
        facilities: 'Red Room, Smoothie Bar, Showers, Towel Service.',
        photos: [
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1375&auto=format&fit=crop'
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '3',
        name: 'SoulCycle NoHo',
        address: {
            street: '384 Lafayette St',
            city: 'New York',
            state: 'NY',
            zip: '10003',
            country: 'USA'
        },
        coordinates: { lat: 40.7272, lng: -73.9936 },
        contactInfo: { phone: '212-555-0123', email: 'noho@soul-cycle.com' },
        operatingHours: {
            monday: { open: '07:00', close: '21:00' }
        },
        facilities: 'Cycling Studio, Locker Room, Merch Shop.',
        photos: [
            'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1374&auto=format&fit=crop'
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export function useGymCenters() {
    const [gyms, setGyms] = useState<GymCenter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API delay for realistic loading skeleton testing
        const timer = setTimeout(() => {
            setGyms(MOCK_GYMS);
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return { gyms, loading, error };
}
