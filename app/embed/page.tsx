export const dynamic = 'force-static'; // page 100% statique
export const revalidate = 0;

export default function EmbedHome() {
  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'60vh',fontFamily:'system-ui'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:24,margin:0}}>Base Miniapp</h1>
        <p style={{opacity:.7,marginTop:8}}>Embed léger pour la console</p>
      </div>
    </main>
  );
}
