/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from '../containers/Bills.js';
import "@testing-library/jest-dom"
import $ from 'jquery';  // Importation correcte de jQuery
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')
      
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am connected as an employee", () => { // describe permet de donner un contexte
  describe("When I am on Bills Page", () => {
    
    test("Then handleClickNewBill should navigate to NewBill page", () => { // test est comme un function, verifie un comportement précis
      const onNavigateMock = jest.fn(); // Une fonction simulée pour suivre les appels à une fonction, j'aurais utilisé onNavigate sinon
      const bills = new Bills({ document, onNavigate: onNavigateMock, store: null, localStorage: null });
      bills.handleClickNewBill(); // On appelle une méthode qui doit naviguer vers la page "NewBill"
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['NewBill']); // Vérifie que la méthode de navigation a été appelée avec le bon chemin
    });

    test("Then handleClickIconEye should open the modal with the correct bill image", () => {
      const bills = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: null });
      const icon = document.createElement('div');
      icon.setAttribute('data-bill-url', 'fake-url.jpg');
      bills.handleClickIconEye(icon);
      expect($('#modaleFile').find("img").attr("src")).toBe('fake-url.jpg');
    });

    test("Then getBills should return correctly formatted bills", async () => {
      const storeMock = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([
            { date: '2021-12-01', status: 'pending' },
            { date: '2022-01-01', status: 'accepted' }
          ])
        })
      };
      const bills = new Bills({ document, onNavigate: jest.fn(), store: storeMock, localStorage: null });
      const fetchedBills = await bills.getBills();
      
      expect(fetchedBills).toEqual([
        { date: '1 Déc. 21', status: 'En attente' },
        { date: '1 Jan. 22', status: 'Accepté' }
      ]);
    });

  });
});
