document.addEventListener("DOMContentLoaded", async () => {
  PhoneMask.setup();
  CountryPicker.setup();

  await Auth.setup();
  Messages.setupSendForm();
  Search.setup();
  await UI.init();
});
