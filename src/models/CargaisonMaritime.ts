import { Cargaison, TypeCargaison, type Trajet } from "./Cargaison"

export class CargaisonMaritime extends Cargaison {
  public nomNavire: string
  public numeroConteneur: string

  constructor(numero: string, poidsMax: number, trajet: Trajet, nomNavire: string, numeroConteneur: string) {
    super(numero, poidsMax, trajet, TypeCargaison.MARITIME)
    this.nomNavire = nomNavire
    this.numeroConteneur = numeroConteneur
  }

  public calculerTarifTransport(): number {
    // Tarif maritime: 50 FCFA par kg par 100km
    return (this.poidsMax * this.distance * 50) / 100
  }
}
