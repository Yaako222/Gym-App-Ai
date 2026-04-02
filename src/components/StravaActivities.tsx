import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, MapPin, RefreshCw } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../contexts/LanguageContext';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
  map: {
    summary_polyline: string;
  };
}

export default function StravaActivities() {
  const { t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStravaConnection();
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'STRAVA_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        if (auth.currentUser) {
          await setDoc(doc(db, `users/${auth.currentUser.uid}/integrations`, 'strava'), {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expires_at,
          });
          setIsConnected(true);
          fetchStravaActivities(tokens.access_token);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStravaConnection = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, `users/${auth.currentUser.uid}/integrations`, 'strava');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIsConnected(true);
        const data = docSnap.data();
        // In a real app, we would check expiresAt and use refreshToken if needed
        fetchStravaActivities(data.accessToken);
      } else {
        setIsConnected(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking Strava connection:", error);
      setIsLoading(false);
    }
  };

  const fetchStravaActivities = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=5', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
        
        // Save to Firestore for persistence and sync to logs
        if (auth.currentUser) {
          const batch = data.map(async (activity: any) => {
            // Save raw strava activity
            await setDoc(doc(db, `users/${auth.currentUser!.uid}/strava_activities`, activity.id.toString()), activity);
            
            // Sync to exercise logs
            const logId = `strava_${activity.id}`;
            const durationMinutes = Math.round(activity.moving_time / 60);
            
            // Basic calorie estimation: MET * weight * duration (hrs)
            // Running ~ 9.8 MET, Cycling ~ 7.5 MET, Walking ~ 3.5 MET
            let met = 7;
            if (activity.type === 'Run') met = 9.8;
            if (activity.type === 'Ride') met = 7.5;
            if (activity.type === 'Walk') met = 3.5;
            if (activity.type === 'Swim') met = 6.0;
            
            // Assume 75kg if we don't have user weight readily available here, or fetch it.
            // For simplicity, we'll use a standard 75kg * MET * (duration/60)
            const estimatedCalories = Math.round(met * 75 * (durationMinutes / 60));

            await setDoc(doc(db, `users/${auth.currentUser!.uid}/logs`, logId), {
              id: logId,
              planId: 'strava_sync',
              name: `Strava: ${activity.name}`,
              duration: durationMinutes,
              date: activity.start_date,
              muscleGroup: 'cardio',
              userId: auth.currentUser!.uid,
              caloriesBurned: estimatedCalories,
              isStrava: true
            }, { merge: true });
          });
          await Promise.all(batch);
        }
      } else {
        console.error("Failed to fetch Strava activities");
        // If unauthorized, might need to refresh token. For simplicity, we just disconnect.
        if (response.status === 401) {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error("Error fetching Strava activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Use window.location.origin for the redirect URI
      const redirectUri = `${window.location.origin}/auth/callback`;
      const clientId = (import.meta as any).env.VITE_STRAVA_CLIENT_ID || '219381'; // Fallback to provided ID
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'activity:read_all',
      });

      const authUrl = `https://www.strava.com/oauth/authorize?${params}`;

      const authWindow = window.open(
        authUrl,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your Strava account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km';
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex items-center justify-center h-48">
        <RefreshCw className="w-8 h-8 text-[#fc4c02] animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm text-center">
        <div className="w-16 h-16 bg-[#fc4c02]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[#fc4c02]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('connectStrava')}</h3>
        <p className="text-slate-400 text-sm mb-6">{t('syncGps')}</p>
        <button
          onClick={handleConnect}
          className="bg-[#fc4c02] hover:bg-[#e34402] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-[#fc4c02]/20 mb-4"
        >
          {t('connectStrava')}
        </button>
        <div className="text-xs text-slate-500 bg-black/20 p-3 rounded-lg text-left overflow-hidden">
          <p className="font-bold mb-1">Strava API Setup Info:</p>
          <p>Authorization Callback Domain:</p>
          <code className="text-[#fc4c02] select-all block mt-1 break-all">
            {window.location.hostname}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fc4c02]/20 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#fc4c02]" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('stravaActivities')}</h2>
        </div>
        <button 
          onClick={() => checkStravaConnection()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-slate-400 text-center py-4">{t('noRecentActivities')}</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold">{activity.name}</h3>
                  <span className="text-xs text-slate-400">
                    {new Date(activity.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-slate-300">
                  <span>{activity.type}</span>
                  <span>•</span>
                  <span>{formatDistance(activity.distance)}</span>
                  <span>•</span>
                  <span>{formatTime(activity.moving_time)}</span>
                </div>
              </div>
              
              {activity.map?.summary_polyline && (
                <div className="h-48 w-full bg-slate-800 relative z-0">
                  <MapContainer 
                    bounds={polyline.decode(activity.map.summary_polyline).map(p => [p[0], p[1]])}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    dragging={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <Polyline 
                      positions={polyline.decode(activity.map.summary_polyline).map(p => [p[0], p[1]])} 
                      color="#fc4c02" 
                      weight={3} 
                      opacity={0.8} 
                    />
                  </MapContainer>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
