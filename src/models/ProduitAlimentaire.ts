import { Produit, TypeProduit } from "./Produit"

export class ProduitAlimentaire extends Produit {
  public dateExpiration: Date
  public temperatureStockage: number

  constructor(poids: number, expediteur: any, destinataire: any, dateExpiration: Date, temperatureStockage: number) {
    super(poids, TypeProduit.ALIMENTAIRE, expediteur, destinataire)
    this.dateExpiration = dateExpiration
    this.temperatureStockage = temperatureStockage
  }

  public calculerPrix(): number {
    let prix = this.poids * 120 // Prix de base majoré pour les produits alimentaires

    // Majoration pour les produits réfrigérés
    if (this.temperatureStockage < 10) {
      prix *= 1.3
    }

    return Math.max(prix, 10000)
  }
}
