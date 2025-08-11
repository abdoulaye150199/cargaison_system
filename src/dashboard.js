// Check authentication
const token = localStorage.getItem("token")
const user = JSON.parse(localStorage.getItem("user") || "{}")

if (!token) {
  window.location.href = "/login"
}

// Set user email
document.getElementById("userEmail").textContent = user.email || ""

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/login"
})

// Navigation
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const section = e.target.dataset.section
    showSection(section)

    // Update active nav
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("bg-blue-600"))
    e.target.classList.add("bg-blue-600")
  })
})

// Show section function
function showSection(sectionName) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden")
  })
  document.getElementById(`${sectionName}-section`).classList.remove("hidden")

  // Load data for the section
  switch (sectionName) {
    case "dashboard":
      loadDashboardData()
      break
    case "cargaisons":
      loadCargaisons()
      break
    case "colis":
      loadColis()
      break
    case "clients":
      loadClients()
      break
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const [cargaisonsRes, colisRes, clientsRes] = await Promise.all([
      fetch("/api/cargaisons"), 
      fetch("/api/colis"),
      fetch("/api/clients")
    ])

    const cargaisons = await cargaisonsRes.json()
    const colis = await colisRes.json()
    const clients = await clientsRes.json()

    document.getElementById("totalCargaisons").textContent = cargaisons.length
    document.getElementById("totalColis").textContent = colis.length
    document.getElementById("enTransit").textContent = colis.filter((c) => c.etat === "EN_COURS").length
    document.getElementById("totalClients").textContent = clients.length
  } catch (error) {
    console.error("Error loading dashboard data:", error)
  }
}

// Load cargaisons
async function loadCargaisons() {
  try {
    const response = await fetch("/api/cargaisons")
    const cargaisons = await response.json()

    const tbody = document.getElementById("cargaisonsTable")
    tbody.innerHTML = cargaisons
      .map(
        (cargaison) => `
            <tr class="border-b border-gray-700">
                <td class="py-3 px-4">${cargaison.numero}</td>
                <td class="py-3 px-4">${cargaison.type}</td>
                <td class="py-3 px-4">${cargaison.lieuDepart}</td>
                <td class="py-3 px-4">${cargaison.lieuArrivee}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(cargaison.etatAvancement)}">
                        ${cargaison.etatAvancement}
                    </span>
                    <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(cargaison.etatGlobal)} ml-1">
                        ${cargaison.etatGlobal}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                        <button class="text-blue-400 hover:text-blue-300 text-xs" onclick="editCargaison('${cargaison.id}')">
                            Modifier
                        </button>
                        ${cargaison.etatGlobal === 'OUVERT' ? 
                            `<button class="text-yellow-400 hover:text-yellow-300 text-xs" onclick="closeCargaison('${cargaison.id}')">
                                Fermer
                            </button>` : 
                            (cargaison.etatAvancement === 'EN_ATTENTE' ? 
                                `<button class="text-green-400 hover:text-green-300 text-xs" onclick="reopenCargaison('${cargaison.id}')">
                                    Rouvrir
                                </button>` : '')
                        }
                        <button class="text-red-400 hover:text-red-300 text-xs" onclick="deleteCargaison('${cargaison.id}')">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading cargaisons:", error)
  }
}

// Load colis
async function loadColis() {
  try {
    const response = await fetch("/api/colis")
    const colis = await response.json()

    const tbody = document.getElementById("colisTable")
    tbody.innerHTML = colis
      .map(
        (c) => `
            <tr class="border-b border-gray-700">
                <td class="py-3 px-4">${c.code}</td>
                <td class="py-3 px-4">${c.expediteur.nom} ${c.expediteur.prenom}</td>
                <td class="py-3 px-4">${c.destinataire.nom} ${c.destinataire.prenom}</td>
                <td class="py-3 px-4">${c.poids} kg</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(c.etat)}">
                        ${c.etat}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                        <button class="text-blue-400 hover:text-blue-300 text-xs" onclick="editColis('${c.id}')">
                            Modifier
                        </button>
                        <button class="text-green-400 hover:text-green-300 text-xs" onclick="markAsRecovered('${c.code}')">
                            Récupéré
                        </button>
                        <button class="text-red-400 hover:text-red-300 text-xs" onclick="markAsLost('${c.code}')">
                            Perdu
                        </button>
                        <button class="text-gray-400 hover:text-gray-300 text-xs" onclick="archiveColis('${c.code}')">
                            Archiver
                        </button>
                        <button class="text-purple-400 hover:text-purple-300 text-xs" onclick="changeColisState('${c.code}')">
                            Changer État
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading colis:", error)
  }
}

// Load clients
async function loadClients() {
  try {
    const response = await fetch("/api/clients")
    const clients = await response.json()

    const tbody = document.getElementById("clientsTable")
    tbody.innerHTML = clients
      .map(
        (client) => `
            <tr class="border-b border-gray-700">
                <td class="py-3 px-4">${client.nom}</td>
                <td class="py-3 px-4">${client.prenom}</td>
                <td class="py-3 px-4">${client.telephone}</td>
                <td class="py-3 px-4">${client.email || "N/A"}</td>
                <td class="py-3 px-4">${client.adresse}</td>
            </tr>
        `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading clients:", error)
  }
}

// Utility functions
function getStatusColor(status) {
  const colors = {
    EN_ATTENTE: "bg-yellow-900 text-yellow-200",
    EN_COURS: "bg-blue-900 text-blue-200",
    ARRIVE: "bg-green-900 text-green-200",
    RECUPERE: "bg-green-900 text-green-200",
    PERDU: "bg-red-900 text-red-200",
    ARCHIVE: "bg-gray-900 text-gray-200",
    OUVERT: "bg-green-900 text-green-200",
    FERME: "bg-red-900 text-red-200",
  }
  return colors[status] || "bg-gray-900 text-gray-200"
}

// Modal functions
function showModal(title, content) {
  const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div>${content}</div>
            </div>
        </div>
    `
  document.getElementById("modalContainer").innerHTML = modal
}

function closeModal() {
  document.getElementById("modalContainer").innerHTML = ""
}

// New Cargaison Modal
document.getElementById("newCargaisonBtn").addEventListener("click", () => {
  const content = `
        <form id="newCargaisonForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Numéro</label>
                    <input type="text" name="numero" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Type</label>
                    <select name="type" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="MARITIME">Maritime</option>
                        <option value="AERIENNE">Aérienne</option>
                        <option value="ROUTIERE">Routière</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Poids Maximum (kg)</label>
                    <input type="number" name="poidsMax" step="0.1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Distance (km)</label>
                    <input type="number" name="distance" step="0.1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Lieu de Départ</label>
                    <input type="text" name="lieuDepart" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Lieu d'Arrivée</label>
                    <input type="text" name="lieuArrivee" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">État d'avancement</label>
                    <select name="etatAvancement" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="EN_ATTENTE">En attente</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="ARRIVE">Arrivé</option>
                        <option value="EN_RETARD">En retard</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">État global</label>
                    <select name="etatGlobal" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="OUVERT">Ouvert</option>
                        <option value="FERME">Fermé</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Types de produits acceptés</label>
                <div class="grid grid-cols-2 gap-2">
                    <label class="flex items-center">
                        <input type="checkbox" name="typesProduits" value="MATERIEL" class="mr-2" checked>
                        <span>Matériel</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="typesProduits" value="ALIMENTAIRE" class="mr-2">
                        <span>Alimentaire</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="typesProduits" value="CHIMIQUE" class="mr-2">
                        <span>Chimique</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="typesProduits" value="FRAGILE" class="mr-2">
                        <span>Fragile</span>
                    </label>
                </div>
            </div>
            <div class="flex justify-end space-x-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition duration-200">
                    Annuler
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200">
                    Créer
                </button>
            </div>
        </form>
    `

  showModal("Nouvelle Cargaison", content)

  document.getElementById("newCargaisonForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    // Handle multiple checkboxes for typesProduits
    const typesProduits = Array.from(e.target.querySelectorAll('input[name="typesProduits"]:checked')).map(cb => cb.value)
    data.typesProduits = typesProduits

    try {
      const response = await fetch("/api/cargaisons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        closeModal()
        loadCargaisons()
        showNotification("Cargaison créée avec succès!", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error creating cargaison:", error)
      showNotification("Erreur lors de la création de la cargaison", "error")
    }
  })
})

// New Colis Modal
document.getElementById("newColisBtn").addEventListener("click", async () => {
  // Load available cargaisons
  const cargaisonsResponse = await fetch("/api/cargaisons")
  const cargaisons = await cargaisonsResponse.json()
  const openCargaisons = cargaisons.filter(c => c.etatGlobal === 'OUVERT')
  
  const content = `
        <form id="newColisForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold mb-2">Expéditeur</h4>
                    <input type="text" name="expediteur_nom" placeholder="Nom" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="text" name="expediteur_prenom" placeholder="Prénom" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="tel" name="expediteur_telephone" placeholder="Téléphone" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="text" name="expediteur_adresse" placeholder="Adresse" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="email" name="expediteur_email" placeholder="Email (optionnel)" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <h4 class="font-semibold mb-2">Destinataire</h4>
                    <input type="text" name="destinataire_nom" placeholder="Nom" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="text" name="destinataire_prenom" placeholder="Prénom" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="tel" name="destinataire_telephone" placeholder="Téléphone" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="text" name="destinataire_adresse" placeholder="Adresse" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" required>
                    <input type="email" name="destinataire_email" placeholder="Email (optionnel)" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <div class="grid grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Nombre de colis</label>
                    <input type="number" name="nombreColis" min="1" value="1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Poids (kg)</label>
                    <input type="number" name="poids" step="0.1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Type de Produit</label>
                    <select name="typeProduit" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="MATERIEL">Matériel</option>
                        <option value="ALIMENTAIRE">Alimentaire</option>
                        <option value="CHIMIQUE">Chimique</option>
                        <option value="FRAGILE">Fragile</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Type de Cargaison</label>
                    <select name="typeCargaison" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="MARITIME">Maritime</option>
                        <option value="AERIENNE">Aérienne</option>
                        <option value="ROUTIERE">Routière</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Cargaison (optionnel)</label>
                <select name="cargaisonId" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Aucune cargaison assignée</option>
                    ${openCargaisons.map(c => `<option value="${c.id}">${c.numero} - ${c.lieuDepart} → ${c.lieuArrivee}</option>`).join('')}
                </select>
            </div>
            
            <div class="flex justify-end space-x-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition duration-200">
                    Annuler
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200">
                    Créer
                </button>
            </div>
        </form>
    `

  showModal("Nouveau Colis", content)

  document.getElementById("newColisForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)

    // Structure the data properly
    const colisData = {
      expediteur: {
        nom: data.expediteur_nom,
        prenom: data.expediteur_prenom,
        telephone: data.expediteur_telephone,
        adresse: data.expediteur_adresse,
        email: data.expediteur_email,
      },
      destinataire: {
        nom: data.destinataire_nom,
        prenom: data.destinataire_prenom,
        telephone: data.destinataire_telephone,
        adresse: data.destinataire_adresse,
        email: data.destinataire_email,
      },
      nombreColis: parseInt(data.nombreColis),
      poids: parseFloat(data.poids),
      typeProduit: data.typeProduit,
      typeCargaison: data.typeCargaison,
      cargaisonId: data.cargaisonId || null,
    }

    try {
      const response = await fetch("/api/colis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(colisData),
      })

      const result = await response.json()
      if (result.success) {
        closeModal()
        loadColis()
        showReceipt(result.colis)
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error creating colis:", error)
      showNotification("Erreur lors de la création du colis", "error")
    }
  })
})

// Show receipt
function showReceipt(colis) {
  const content = `
        <div class="bg-white text-black p-6 rounded-lg">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold">GPduMonde</h2>
                <p class="text-gray-600">Reçu d'Expédition</p>
            </div>
            
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 class="font-semibold mb-2">Expéditeur</h3>
                    <p>${colis.expediteur.nom} ${colis.expediteur.prenom}</p>
                    <p>${colis.expediteur.telephone}</p>
                    <p>${colis.expediteur.adresse}</p>
                    ${colis.expediteur.email ? `<p>${colis.expediteur.email}</p>` : ''}
                </div>
                <div>
                    <h3 class="font-semibold mb-2">Destinataire</h3>
                    <p>${colis.destinataire.nom} ${colis.destinataire.prenom}</p>
                    <p>${colis.destinataire.telephone}</p>
                    <p>${colis.destinataire.adresse}</p>
                    ${colis.destinataire.email ? `<p>${colis.destinataire.email}</p>` : ''}
                </div>
            </div>
            
            <div class="border-t border-gray-300 pt-4 mb-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p><strong>Code de suivi:</strong> ${colis.code}</p>
                        <p><strong>Nombre de colis:</strong> ${colis.nombreColis || 1}</p>
                        <p><strong>Poids:</strong> ${colis.poids} kg</p>
                    </div>
                    <div>
                        <p><strong>Type:</strong> ${colis.typeProduit}</p>
                        <p><strong>Cargaison:</strong> ${colis.typeCargaison}</p>
                        <p><strong>Prix:</strong> ${colis.prix.toLocaleString()} FCFA</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center text-sm text-gray-600">
                <p>Conservez ce reçu pour le suivi de votre colis</p>
                <p>Code de suivi: <strong>${colis.code}</strong></p>
                <p>Date: ${new Date().toLocaleDateString("fr-FR")}</p>
            </div>
            
            <div class="flex justify-center mt-4">
                <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded-md mr-2">
                    Imprimer
                </button>
                <button onclick="closeModal()" class="bg-gray-600 text-white px-4 py-2 rounded-md">
                    Fermer
                </button>
            </div>
        </div>
    `

  showModal("Reçu d'Expédition", content)
}

// Action functions
async function markAsRecovered(code) {
  try {
    const response = await fetch(`/api/colis/${code}/recover`, {
      method: "PUT",
    })

    const result = await response.json()
    if (result.success) {
      loadColis()
      showNotification("Colis marqué comme récupéré", "success")
    } else {
      showNotification("Erreur: " + result.message, "error")
    }
  } catch (error) {
    console.error("Error marking as recovered:", error)
    showNotification("Erreur lors de la mise à jour", "error")
  }
}

async function markAsLost(code) {
  if (confirm("Êtes-vous sûr de vouloir marquer ce colis comme perdu?")) {
    try {
      const response = await fetch(`/api/colis/${code}/lost`, {
        method: "PUT",
      })

      const result = await response.json()
      if (result.success) {
        loadColis()
        showNotification("Colis marqué comme perdu", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error marking as lost:", error)
      showNotification("Erreur lors de la mise à jour", "error")
    }
  }
}

async function archiveColis(code) {
  if (confirm("Êtes-vous sûr de vouloir archiver ce colis?")) {
    try {
      const response = await fetch(`/api/colis/${code}/archive`, {
        method: "PUT",
      })

      const result = await response.json()
      if (result.success) {
        loadColis()
        showNotification("Colis archivé", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error archiving colis:", error)
      showNotification("Erreur lors de l'archivage", "error")
    }
  }
}

function changeColisState(code) {
  const content = `
    <form id="changeStateForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Nouvel état</label>
        <select name="etat" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="ARRIVE">Arrivé</option>
          <option value="RECUPERE">Récupéré</option>
          <option value="PERDU">Perdu</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      </div>
      <div class="flex justify-end space-x-4">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition duration-200">
          Annuler
        </button>
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200">
          Changer
        </button>
      </div>
    </form>
  `
  
  showModal("Changer l'état du colis", content)
  
  document.getElementById("changeStateForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    try {
      const response = await fetch(`/api/colis/${code}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        closeModal()
        loadColis()
        showNotification("État du colis modifié", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error changing state:", error)
      showNotification("Erreur lors de la modification", "error")
    }
  })
}

async function closeCargaison(id) {
  if (confirm("Êtes-vous sûr de vouloir fermer cette cargaison?")) {
    try {
      const response = await fetch(`/api/cargaisons/${id}/close`, {
        method: "PUT",
      })

      const result = await response.json()
      if (result.success) {
        loadCargaisons()
        showNotification("Cargaison fermée", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error closing cargaison:", error)
      showNotification("Erreur lors de la fermeture", "error")
    }
  }
}

async function reopenCargaison(id) {
  if (confirm("Êtes-vous sûr de vouloir rouvrir cette cargaison?")) {
    try {
      const response = await fetch(`/api/cargaisons/${id}/reopen`, {
        method: "PUT",
      })

      const result = await response.json()
      if (result.success) {
        loadCargaisons()
        showNotification("Cargaison rouverte", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error reopening cargaison:", error)
      showNotification("Erreur lors de la réouverture", "error")
    }
  }
}

async function deleteCargaison(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette cargaison?")) {
    try {
      const response = await fetch(`/api/cargaisons/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        loadCargaisons()
        showNotification("Cargaison supprimée", "success")
      } else {
        showNotification("Erreur: " + result.message, "error")
      }
    } catch (error) {
      console.error("Error deleting cargaison:", error)
      showNotification("Erreur lors de la suppression", "error")
    }
  }
}

function editCargaison(id) {
  showNotification("Fonctionnalité d'édition en cours de développement", "info")
}

function editColis(id) {
  showNotification("Fonctionnalité d'édition en cours de développement", "info")
}

// Notification system
function showNotification(message, type = "info") {
  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-yellow-600"
  }
  
  const notification = document.createElement("div")
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.opacity = "0"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Search functionality
document.getElementById("searchColisForm").addEventListener("submit", async (e) => {
  e.preventDefault()
  const code = document.getElementById("colisCode").value.trim()
  
  if (!code) {
    showNotification("Veuillez entrer un code de suivi", "warning")
    return
  }
  
  try {
    const response = await fetch(`/api/colis/track/${encodeURIComponent(code)}`)
    const result = await response.json()
    
    if (result.success) {
      showColisDetails(result.colis)
    } else {
      showNotification(result.message, "error")
    }
  } catch (error) {
    console.error("Error searching colis:", error)
    showNotification("Erreur lors de la recherche", "error")
  }
})

function showColisDetails(colis) {
  const content = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="font-semibold mb-2">Informations du colis</h4>
          <p><strong>Code:</strong> ${colis.code}</p>
          <p><strong>Poids:</strong> ${colis.poids} kg</p>
          <p><strong>Type:</strong> ${colis.typeProduit}</p>
          <p><strong>Prix:</strong> ${colis.prix.toLocaleString()} FCFA</p>
          <p><strong>État:</strong> <span class="px-2 py-1 rounded text-xs ${getStatusColor(colis.etat)}">${colis.etat}</span></p>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Expéditeur</h4>
          <p>${colis.expediteur.nom} ${colis.expediteur.prenom}</p>
          <p>${colis.expediteur.telephone}</p>
          <p>${colis.expediteur.adresse}</p>
          
          <h4 class="font-semibold mb-2 mt-4">Destinataire</h4>
          <p>${colis.destinataire.nom} ${colis.destinataire.prenom}</p>
          <p>${colis.destinataire.telephone}</p>
          <p>${colis.destinataire.adresse}</p>
        </div>
      </div>
    </div>
  `
  
  showModal("Détails du colis", content)
}

// Initialize dashboard
showSection("dashboard")