import { Produit, TypeProduit } from "./Produit"

export class ProduitMateriel extends Produit {
  public fragile: boolean

  constructor(poids: number, expediteur: any, destinataire: any, fragile = false) {
    super(poids, TypeProduit.MATERIEL, expediteur, destinataire)
    this.fragile = fragile
  }

  public calculerPrix(): number {
    let prix = this.poids * 100 // Prix de base: 100 FCFA par kg

    if (this.fragile) {
      prix *= 1.5 // Majoration de 50% pour les produits fragiles
    }

    return Math.max(prix, 10000) // Prix minimum de 10,000 FCFA
  }
}
