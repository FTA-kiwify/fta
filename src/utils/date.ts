export function getBrazilNow() {

  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    })
  );

}

export function getBrazilToday() {

  const today = getBrazilNow();

  today.setHours(0, 0, 0, 0);

  return today;

}

export function getGreeting() {

  const hour = getBrazilNow().getHours();

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";

}