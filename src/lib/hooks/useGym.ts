import { useState, useEffect } from 'react';
import { GymCenter } from '@/types/gym';

// Single facility data for SOL Pilates
const GYM_DATA: GymCenter = {
    id: 'sol-pilates',
    name: 'SOL Pilates',
    address: {
        street: '250 West 54th Street',
        city: 'New York',
        state: 'NY',
        zip: '10019',
        country: 'USA'
    },
    coordinates: { lat: 40.7638, lng: -73.9826 },
    contactInfo: {
        phone: '(212) 555-0180',
        email: 'hello@solpilates.com'
    },
    operatingHours: {
        monday: { open: '05:00', close: '23:00' },
        tuesday: { open: '05:00', close: '23:00' },
        wednesday: { open: '05:00', close: '23:00' },
        thursday: { open: '05:00', close: '23:00' },
        friday: { open: '05:00', close: '22:00' },
        saturday: { open: '06:00', close: '21:00' },
        sunday: { open: '07:00', close: '20:00' }
    },
    facilities: 'Performance Training Floor, Heated Yoga Studio, Indoor Cycling Theater, Olympic Lifting Platform, Recovery Lounge with Cryotherapy, Sauna & Steam Room, Smoothie Bar, Private Training Suites',
    photos: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1469&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1375&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1374&auto=format&fit=crop'
    ],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
};

export function useGym() {
    const [gym, setGym] = useState<GymCenter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setGym(GYM_DATA);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return { gym, loading, error };
}

// Export the gym data directly for cases that don't need reactivity
export { GYM_DATA };
