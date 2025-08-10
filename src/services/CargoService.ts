import { type Cargaison, TypeCargaison } from "../models/Cargaison"
import { CargaisonMaritime } from "../models/CargaisonMaritime"
import { CargaisonAerienne } from "../models/CargaisonAerienne"
import { CargaisonRoutiere } from "../models/CargaisonRoutiere"
import { type Produit, EtatColis } from "../models/Produit"

export class CargoService {
  private static instance: CargoService
  private cargaisons: Cargaison[] = []
  private produits: Produit[] = []

  private constructor() {}

  public static getInstance(): CargoService {
    if (!CargoService.instance) {
      CargoService.instance = new CargoService()
    }
    return CargoService.instance
  }

  // Gestion des cargaisons
  public creerCargaison(
    type: TypeCargaison,
    numero: string,
    poidsMax: number,
    trajet: any,
    parametresSpecifiques: any,
  ): Cargaison {
    let cargaison: Cargaison

    switch (type) {
      case TypeCargaison.MARITIME:
        cargaison = new CargaisonMaritime(
          numero,
          poidsMax,
          trajet,
          parametresSpecifiques.nomNavire,
          parametresSpecifiques.numeroConteneur,
        )
        break
      case TypeCargaison.AERIENNE:
        cargaison = new CargaisonAerienne(
          numero,
          poidsMax,
          trajet,
          parametresSpecifiques.numeroVol,
          parametresSpecifiques.compagnieAerienne,
        )
        break
      case TypeCargaison.ROUTIERE:
        cargaison = new CargaisonRoutiere(
          numero,
          poidsMax,
          trajet,
          parametresSpecifiques.immatriculationCamion,
          parametresSpecifiques.chauffeur,
        )
        break
      default:
        throw new Error("Type de cargaison non supporté")
    }

    this.cargaisons.push(cargaison)
    return cargaison
  }

  public rechercherCargaison(criteres: {
    code?: string
    lieuDepart?: string
    lieuArrivee?: string
    dateDepart?: Date
    dateArrivee?: Date
    type?: TypeCargaison
  }): Cargaison[] {
    return this.cargaisons.filter((cargaison) => {
      if (criteres.code && cargaison.numero !== criteres.code) return false
      if (criteres.type && cargaison.type !== criteres.type) return false
      // Ajouter d'autres critères de recherche
      return true
    })
  }

  public fermerCargaison(cargaisonId: string): boolean {
    const cargaison = this.cargaisons.find((c) => c.id === cargaisonId)
    if (cargaison) {
      cargaison.fermer()
      return true
    }
    return false
  }

  public rouvrirCargaison(cargaisonId: string): boolean {
    const cargaison = this.cargaisons.find((c) => c.id === cargaisonId)
    if (cargaison) {
      cargaison.rouvrir()
      return true
    }
    return false
  }

  // Gestion des produits/colis
  public ajouterProduit(produit: Produit, cargaisonId?: string): boolean {
    this.produits.push(produit)

    if (cargaisonId) {
      const cargaison = this.cargaisons.find((c) => c.id === cargaisonId)
      if (cargaison && cargaison.ajouterProduit(produit.id, produit.prix)) {
        produit.cargaisonId = cargaisonId
        return true
      }
    }

    return true
  }

  public rechercherColisByCode(code: string): Produit | null {
    return this.produits.find((p) => p.code === code) || null
  }

  public marquerColisCommeRecupere(code: string): boolean {
    const colis = this.rechercherColisByCode(code)
    if (colis) {
      colis.marquerCommeRecupere()
      return true
    }
    return false
  }

  public marquerColisCommePerdu(code: string): boolean {
    const colis = this.rechercherColisByCode(code)
    if (colis) {
      colis.marquerCommePerdu()
      return true
    }
    return false
  }

  public archiverColis(code: string): boolean {
    const colis = this.rechercherColisByCode(code)
    if (colis) {
      colis.archiver()
      return true
    }
    return false
  }

  public changerEtatColis(code: string, nouvelEtat: EtatColis): boolean {
    const colis = this.rechercherColisByCode(code)
    if (colis) {
      colis.changerEtat(nouvelEtat)
      return true
    }
    return false
  }

  // Getters
  public getCargaisons(): Cargaison[] {
    return this.cargaisons
  }

  public getProduits(): Produit[] {
    return this.produits
  }

  public getStatistiques() {
    return {
      totalCargaisons: this.cargaisons.length,
      totalColis: this.produits.length,
      colisEnTransit: this.produits.filter((p) => p.etat === EtatColis.EN_COURS).length,
      colisArrive: this.produits.filter((p) => p.etat === EtatColis.ARRIVE).length,
    }
  }
}
