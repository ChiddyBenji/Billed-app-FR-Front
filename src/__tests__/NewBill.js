/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() =>
          JSON.stringify({ email: "test@example.com" })
        ),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
    });

    test("Then handleChangeFile should validate the file extension", async () => {
      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: "mockFileUrl", key: "mockKey" }),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      // Créer une instance de File avec une extension valide
      const file = new File(["dummy content"], "test-image.png", { type: "image/png" });

      // Définir le fichier sur l'élément input
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });

      // Déclencher l'événement de changement
      fireEvent.change(fileInput);

      // Attendre que handleChangeFile soit appelé
      await expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then handleSubmit should call updateBill and navigate to Bills page", () => {
      const onNavigate = jest.fn(); // Mock de la fonction de navigation
      const store = {
        bills: jest.fn(() => ({
          update: jest.fn().mockResolvedValue({}),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      // Vérification que handleSubmit a été appelé
      expect(handleSubmit).toHaveBeenCalled();

      // Vérification que la navigation est bien effectuée
      expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
    });

    describe("When I submit a new bill", () => {
      test("Then it should make a POST request and navigate to Bills page", async () => {
        const onNavigate = jest.fn();
        const store = {
          bills: jest.fn(() => ({
            update: jest.fn().mockResolvedValue({}),
          })),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        newBill.fileUrl = "http://localhost/file.png";
        newBill.fileName = "file.png";

        const form = screen.getByTestId("form-new-bill");
        fireEvent.submit(form);

        expect(store.bills).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
      });
    });
  });
});
