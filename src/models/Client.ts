export interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string
  email?: string
  dateCreation: Date
}

export class ClientService {
  public static creerClient(nom: string, prenom: string, telephone: string, adresse: string, email?: string): Client {
    return {
      id: "CLI" + Date.now().toString(),
      nom,
      prenom,
      telephone,
      adresse,
      email,
      dateCreation: new Date(),
    }
  }
}
