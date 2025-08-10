import { Produit, TypeProduit } from "./Produit"

export class ProduitChimique extends Produit {
  public dangereux: boolean
  public classeRisque: string

  constructor(poids: number, expediteur: any, destinataire: any, dangereux: boolean, classeRisque: string) {
    super(poids, TypeProduit.CHIMIQUE, expediteur, destinataire)
    this.dangereux = dangereux
    this.classeRisque = classeRisque
  }

  public calculerPrix(): number {
    let prix = this.poids * 200 // Prix de base élevé pour les produits chimiques

    if (this.dangereux) {
      prix *= 2 // Double le prix pour les produits dangereux
    }

    return Math.max(prix, 10000)
  }
}
