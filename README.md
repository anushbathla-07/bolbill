# BolBill

**BolBill** is a simple billing and shop-management web app designed to
help small shopkeepers create bills and manage everyday sales.

## Features

-   Voice-based billing with Hindi/Hinglish input (where supported by
    the browser)
-   Product catalog with prices, units, and aliases
-   Bill creation and saved bills
-   Customer records and udhaar (credit) tracking
-   Payment records and customer balance tracking
-   Daily sales summaries
-   Speech output and WhatsApp reminder support (where
    configured/supported)
-   Data backup and restore

## Getting Started

### Requirements

-   [Node.js](https://nodejs.org/) and npm
-   [Git](https://git-scm.com/) (optional, for cloning the repository)

### Install and run

Clone the repository:

``` bash
git clone https://github.com/anushbathla-07/bolbill.git
cd bolbill
```

Install dependencies:

``` bash
npm install
```

Run the automated tests:

``` bash
npm test
```

Start the app:

``` bash
npm start
```

If the project prints a local URL in the terminal, open that URL in your
browser. If `npm start` is not configured in your copy, check the
`scripts` section in `package.json` for the available start command.

## Notes

-   Voice recognition depends on browser support and microphone
    permission.
-   Browser-based storage may be limited to the current browser/device.
    Export backups regularly.
-   Test the app with sample data before using it for real transactions.
-   Do not commit passwords, API keys, or private customer information
    to GitHub.

## Tech

The project uses JavaScript/Node.js tooling and browser-based web
technologies. See `package.json` and the source folders for the exact
dependencies and implementation details.

## Contributing

Suggestions and improvements are welcome. Create an issue to report a
bug or propose a feature, or submit a pull request.

## License

No license is specified yet. Add a license file if you want to define
how others may use, modify, or distribute this project.
