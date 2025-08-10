export interface Coordonnee {
  latitude: number
  longitude: number
}

export interface Trajet {
  lieuDepart: Coordonnee
  lieuArrivee: Coordonnee
  distance: number
}

export enum EtatAvancement {
  EN_ATTENTE = "EN_ATTENTE",
  EN_COURS = "EN_COURS",
  ARRIVE = "ARRIVE",
  EN_RETARD = "EN_RETARD",
}

export enum EtatGlobal {
  OUVERT = "OUVERT",
  FERME = "FERME",
}

export enum TypeCargaison {
  MARITIME = "MARITIME",
  AERIENNE = "AERIENNE",
  ROUTIERE = "ROUTIERE",
}

export abstract class Cargaison {
  public id: string
  public numero: string
  public poidsMax: number
  public produits: string[] = []
  public prix = 0
  public trajet: Trajet
  public distance: number
  public type: TypeCargaison
  public etatAvancement: EtatAvancement
  public etatGlobal: EtatGlobal
  public dateCreation: Date
  public dateDepart?: Date
  public dateArrivee?: Date

  constructor(numero: string, poidsMax: number, trajet: Trajet, type: TypeCargaison) {
    this.id = this.generateId()
    this.numero = numero
    this.poidsMax = poidsMax
    this.trajet = trajet
    this.distance = trajet.distance
    this.type = type
    this.etatAvancement = EtatAvancement.EN_ATTENTE
    this.etatGlobal = EtatGlobal.OUVERT
    this.dateCreation = new Date()
  }

  private generateId(): string {
    return "CARG" + Date.now().toString()
  }

  public fermer(): void {
    if (this.etatGlobal === EtatGlobal.OUVERT) {
      this.etatGlobal = EtatGlobal.FERME
    }
  }

  public rouvrir(): void {
    if (this.etatGlobal === EtatGlobal.FERME && this.etatAvancement === EtatAvancement.EN_ATTENTE) {
      this.etatGlobal = EtatGlobal.OUVERT
    }
  }

  public ajouterProduit(produitId: string, prix: number): boolean {
    if (this.etatGlobal === EtatGlobal.OUVERT) {
      this.produits.push(produitId)
      this.prix += prix
      return true
    }
    return false
  }

  public abstract calculerTarifTransport(): number
}
