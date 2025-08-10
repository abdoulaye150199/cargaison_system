export enum TypeProduit {
  MATERIEL = "MATERIEL",
  ALIMENTAIRE = "ALIMENTAIRE",
  CHIMIQUE = "CHIMIQUE",
}

export enum EtatColis {
  EN_ATTENTE = "EN_ATTENTE",
  EN_COURS = "EN_COURS",
  ARRIVE = "ARRIVE",
  RECUPERE = "RECUPERE",
  PERDU = "PERDU",
  ARCHIVE = "ARCHIVE",
}

export abstract class Produit {
  public id: string
  public code: string
  public poids: number
  public type: TypeProduit
  public prix: number
  public etat: EtatColis
  public dateCreation: Date
  public expediteur: any
  public destinataire: any
  public cargaisonId?: string

  constructor(poids: number, type: TypeProduit, expediteur: any, destinataire: any) {
    this.id = this.generateId()
    this.code = this.generateCode()
    this.poids = poids
    this.type = type
    this.expediteur = expediteur
    this.destinataire = destinataire
    this.prix = this.calculerPrix()
    this.etat = EtatColis.EN_ATTENTE
    this.dateCreation = new Date()
  }

  private generateId(): string {
    return "PROD" + Date.now().toString()
  }

  private generateCode(): string {
    return "GP" + Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  public abstract calculerPrix(): number

  public changerEtat(nouvelEtat: EtatColis): void {
    this.etat = nouvelEtat
  }

  public marquerCommePerdu(): void {
    this.etat = EtatColis.PERDU
  }

  public marquerCommeRecupere(): void {
    this.etat = EtatColis.RECUPERE
  }

  public archiver(): void {
    this.etat = EtatColis.ARCHIVE
  }
}
