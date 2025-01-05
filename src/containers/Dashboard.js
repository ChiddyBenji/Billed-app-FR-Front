import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
  firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.counters = {}
    $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))
    new Logout({ localStorage, onNavigate })
  }

  // === Modification

  // Fonction qui gère le clic sur l'icône en forme d'œil
handleClickIconEye = () => {
  // Récupération de l'URL de la facture à partir de l'attribut "data-bill-url" de l'élément avec l'id "icon-eye-d"
  const billUrl = $('#icon-eye-d').attr("data-bill-url");

  // Calcul de la largeur de l'image à afficher (80% de la largeur de la modale)
  const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8);

  // Si une URL de facture est disponible
  if (billUrl) {
      // Mise à jour du contenu de la modale pour afficher l'image de la facture
      $('#modaleFileAdmin1')
          .find(".modal-body")
          .html(`<div style='text-align: center;'>
                    <img width=${imgWidth} src=${billUrl} alt="Bill"/>
                 </div>`);
  } else {
      // Si aucune URL n'est disponible, afficher un message indiquant l'absence d'image
      $('#modaleFileAdmin1')
          .find(".modal-body")
          .html('<p>Aucune image disponible.</p>');
  }

  // Affichage de la modale si la méthode "modal" est disponible
  if (typeof $('#modaleFileAdmin1').modal === 'function') {
      $('#modaleFileAdmin1').modal('show');
  }
};

  

  handleEditTicket(e, bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id
    if (this.counter % 2 === 0) {
      bills.forEach(b => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })
      this.counter ++
    } else {
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })

      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      this.counter ++
    }
    $('#icon-eye-d').click(this.handleClickIconEye)
    $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
    $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
  }

  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // modifs

  handleShowTickets(e, bills, index) { // je recois trois elements en arguments, e, bills et index (statut des tickets 1=attente, 2= accepté, 3= refusé)
    // this.counters est un objet qui garde une trace des clics pour chaque liste (index).
    if (!this.counters) 
      this.counters = {}; // 1er fois est vide
    if (!this.counters[index]) 
      this.counters[index] = 0; // Si index n'existe pas encore dans this.counters, on le met a 0
  
    // Alterner entre ouverture et fermeture de la liste
    if (this.counters[index] % 2 === 0) { // si this.counters est pair, on ouvre la liste
      // Ouvrir la liste et afficher les tickets correspondants
      $(`#arrow-icon${index}`).css({ transform: 'rotate(0deg)' });
      const filtered = filteredBills(bills, getStatus(index));
      const htmlContent = cards(filtered);
  
      $(`#status-bills-container${index}`).html(htmlContent);
  
      // Attacher des gestionnaires d'événements pour chaque ticket de la liste
      filtered.forEach((bill) => {
        $(`#open-bill${bill.id}`).click((e) => this.handleEditTicket(e, bill, bills));
      });
    } else {
      // Fermer la liste
      $(`#arrow-icon${index}`).css({ transform: 'rotate(90deg)' });
      $(`#status-bills-container${index}`).html("");
    }
  
    // Incrémenter le compteur pour cette liste
    this.counters[index]++; //Après chaque clic, le compteur pour cette liste (index) est augmenté de 1.
    // Cela permet de basculer entre ouvert et fermé lors des prochains clics.
  }
  

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
        .map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        }))
        return bills
      })
      .catch(error => {
        throw error;
      })
    }
  }

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
    return this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: bill.id})
      .then(bill => bill)
      .catch(console.log)
    }
  }
}
