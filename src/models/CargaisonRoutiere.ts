import { Cargaison, TypeCargaison, type Trajet } from "./Cargaison"

export class CargaisonRoutiere extends Cargaison {
  public immatriculationCamion: string
  public chauffeur: string

  constructor(numero: string, poidsMax: number, trajet: Trajet, immatriculationCamion: string, chauffeur: string) {
    super(numero, poidsMax, trajet, TypeCargaison.ROUTIERE)
    this.immatriculationCamion = immatriculationCamion
    this.chauffeur = chauffeur
  }

  public calculerTarifTransport(): number {
    // Tarif routier: 30 FCFA par kg par 100km
    return (this.poidsMax * this.distance * 30) / 100
  }
}
