export interface Threat {
  id: string
  cluster: string
  name: string
  E: string
  cia: string
  A: string
  desc?: string
  note?: string
  custom?: boolean
  // analyst-filled SPARTA-mapping side of the tuple (optional; blank on raw ENISA rows)
  pre?: string
  ttp?: string
  cm?: string
  impact?: string
  conf?: string
}

export interface Result {
  segs: string[]
  tb: string[]
  L: number[]
  nature: string
  prim: string
  arm: string
  rules: string[]
  multiseg: boolean
  multilife: boolean
  ttp: string
  conf: string
}
