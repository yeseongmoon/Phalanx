export function TopBar() {
  return (
    <div className="top">
      <img className="brandmark" src="/mark.png" width="42" height="42" alt="PHALANX" />
      <div className="brandtext">
        <h1>PHALANX <span className="wordmark-sub">6G NTN Threat-Flow Builder</span></h1>
        <div className="tagline">Crosswalking the ENISA Space Threat Landscape and SPARTA into one line of defense for 6G NTN</div>
      </div>
      <div className="flow">
        <code>Algorithm&nbsp;1</code>
        <b>derive</b><span className="a">→</span><b>map</b><span className="a">→</span><b>chain</b><span className="a">→</span><b>measure</b>
      </div>
    </div>
  )
}
