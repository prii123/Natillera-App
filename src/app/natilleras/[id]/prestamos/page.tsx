
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import PrestamosCreador from "@/components/prestamos/PrestamosCreador";
import PrestamosMiembro from "@/components/prestamos/PrestamosMiembro";
import { fetchAPI } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function PrestamosPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  type Natillera = {
    id: string;
    creator_id: string;
    members: { id: string }[];
    // add other properties as needed
  };
  type User = {
    id: string;
    // add other properties as needed
  };

  const [user, setUser] = useState<User | null>(null);
  const [natillera, setNatillera] = useState<Natillera | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
      } else {
        const natilleraId = params.id;
        try {
          const [userRes, natilleraRes] = await Promise.all([
            fetchAPI("/users/me"),
            fetchAPI(`/natilleras/${natilleraId}`)
          ]);
          if (userRes.ok && natilleraRes.ok) {
            const userData = await userRes.json();
            const natilleraData = await natilleraRes.json();
            // console.log("Natillera Data:", natilleraData);
            setUser(userData);
            setNatillera(natilleraData);
            setIsCreator(natilleraData.creator_id === userData.id);
            // Si el backend permitió el acceso, el usuario es miembro
            setIsMember(true);
          }
        } catch (e) {
          // Manejo de error
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <Navbar>
        {isCreator && natillera && (
          <>
            <Link
              href={`/natilleras/${natillera.id}/transacciones`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-secondary/90 hover:text-white transition-colors group"
              title="Transacciones"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💳</span>
              <span className="text-xs font-semibold mt-1">Transacciones</span>
            </Link>
            <Link
              href={`/natilleras/${natillera.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
          </>
        )}
      </Navbar>
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (isCreator) {
    return (<>
     <Navbar>
        {isCreator && natillera && (
          <>
            <Link
              href={`/natilleras/${natillera.id}/transacciones`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-secondary/90 hover:text-white transition-colors group"
              title="Transacciones"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💳</span>
              <span className="text-xs font-semibold mt-1">Transacciones</span>
            </Link>
            <Link
              href={`/natilleras/${natillera.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
          </>
        )}
      </Navbar>
    <PrestamosCreador natillera={natillera} user={user} />
    </>);
  }
  if (isMember) {
    return (

      <>
       <Navbar>
        {natillera && (
          <>
            <Link
              href={`/natilleras/${natillera.id}/prestamos`}
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-accent/90 hover:text-white transition-colors group"
              title="Préstamos"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💸</span>
              <span className="text-xs font-semibold mt-1">Préstamos</span>
            </Link>
          </>
        )}
      </Navbar>

      <PrestamosMiembro natillera={natillera} user={user} />
      
      </>
    
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">No tienes acceso a los préstamos de esta natillera.</div>
    </div>
  );
}
