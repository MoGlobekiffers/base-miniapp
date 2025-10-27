import ClientProviders from "./providers/ClientProviders";

export default function Home() {
  return (
    <ClientProviders>
      <main style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
        <div style={{textAlign:"center"}}>
          <h1 style={{fontSize:"28px",fontWeight:700}}>Base Mini App</h1>
          <p style={{opacity:.7,marginTop:8}}>
            Déploiement OK. Teste /ready et /api/healthz ci-dessous.
          </p>
          <div style={{marginTop:16,display:"flex",gap:16,justifyContent:"center"}}>
            <a href="/ready">/ready</a>
            <a href="/api/healthz">/api/healthz</a>
          </div>
        </div>
      </main>
    </ClientProviders>
  );
}
