import { Cargaison, TypeCargaison, type Trajet } from "./Cargaison"

export class CargaisonAerienne extends Cargaison {
  public numeroVol: string
  public compagnieAerienne: string

  constructor(numero: string, poidsMax: number, trajet: Trajet, numeroVol: string, compagnieAerienne: string) {
    super(numero, poidsMax, trajet, TypeCargaison.AERIENNE)
    this.numeroVol = numeroVol
    this.compagnieAerienne = compagnieAerienne
  }

  public calculerTarifTransport(): number {
    // Tarif aérien: 200 FCFA par kg par 100km
    return (this.poidsMax * this.distance * 200) / 100
  }
}
