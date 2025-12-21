import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero bg-gradient-to-br from-green-600 to-green-700 text-white py-20 px-5 text-center">
        <h1 className="text-5xl font-bold mb-5 animate-fade-in-down">
          🪙 Natillera
        </h1>
        <p className="text-xl mb-8 opacity-95">
          La forma inteligente de ahorrar en conjunto con tus amigos, familia y compañeros
        </p>
        <div className="flex gap-5 justify-center flex-wrap">
          <Link 
            href="/register" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-lg min-w-[180px] transition-colors"
          >
            Comenzar Ahora
          </Link>
          <Link 
            href="/login" 
            className="bg-white hover:bg-transparent text-green-600 hover:text-white font-bold py-4 px-10 rounded-lg text-lg min-w-[180px] border-2 border-white transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-5 bg-white">
        <h2 className="text-center text-4xl font-bold mb-12 text-green-600">
          ¿Por qué elegir Natillera?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          <FeatureCard 
            icon="👥"
            title="Ahorro Colaborativo"
            description="Crea grupos de ahorro con las personas de confianza. Todos aportan y todos ganan."
          />
          <FeatureCard 
            icon="📊"
            title="Control Total"
            description="Monitorea en tiempo real todos los aportes, pagos y el estado de tus natilleras."
          />
          <FeatureCard 
            icon="🔐"
            title="Seguridad Garantizada"
            description="Tu información y dinero están protegidos con los más altos estándares de seguridad."
          />
          <FeatureCard 
            icon="📱"
            title="Fácil de Usar"
            description="Interfaz intuitiva y sencilla. Gestiona tus natilleras desde cualquier dispositivo."
          />
          <FeatureCard 
            icon="🔔"
            title="Notificaciones"
            description="Recibe alertas sobre aportes, pagos y eventos importantes de tu natillera."
          />
          <FeatureCard 
            icon="💰"
            title="Flexibilidad"
            description="Configura montos, frecuencias y reglas personalizadas para cada natillera."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-5 bg-gray-50">
        <h2 className="text-center text-4xl font-bold mb-12 text-green-600">
          ¿Cómo funciona?
        </h2>
        <div className="max-w-4xl mx-auto space-y-10">
          <Step 
            number={1}
            title="Regístrate"
            description="Crea tu cuenta de forma rápida y gratuita. Solo necesitas tu correo electrónico."
          />
          <Step 
            number={2}
            title="Crea o Únete"
            description="Crea una nueva natillera o acepta invitaciones para unirte a grupos existentes."
          />
          <Step 
            number={3}
            title="Define las Reglas"
            description="Establece el monto de ahorro, frecuencia de aportes y duración del ciclo."
          />
          <Step 
            number={4}
            title="Ahorra y Recibe"
            description="Realiza tus aportes periódicos y recibe tu pago cuando te corresponda según el turno asignado."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-green-700 to-green-600 text-white py-16 px-5 text-center">
        <h2 className="text-4xl font-bold mb-5">
          ¡Comienza a Ahorrar Hoy!
        </h2>
        <p className="text-xl mb-8">
          Únete a miles de personas que ya están cumpliendo sus metas financieras
        </p>
        <Link 
          href="/register" 
          className="inline-block bg-white text-green-600 hover:bg-gray-100 font-bold py-4 px-10 rounded-lg text-lg transition-colors"
        >
          Crear Cuenta Gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-8">
        <p className="mb-2">&copy; 2025 Natillera - Todos los derechos reservados</p>
        <p>Ahorro inteligente en conjunto</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-50 p-8 rounded-xl text-center transition-all hover:-translate-y-2 hover:shadow-xl">
      <div className="text-5xl mb-5">{icon}</div>
      <h3 className="text-green-600 mb-4 text-xl font-semibold">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-center gap-8 bg-white p-8 rounded-xl shadow-md">
      <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-green-600 font-semibold text-xl mb-2">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
}
