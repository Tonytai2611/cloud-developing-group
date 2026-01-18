**# BrewCraft React App

This repository contains the front-end React application for "BrewCraft" — a sample restaurant & cafe web app built with Create React App and Tailwind CSS.

## Project Structure

- `public/` — static assets served from the public root (icons, `index.html`, `manifest.json`).
- `src/` — React source code:
	- `app/` — pages and layouts (app-specific routes)
	- `components/` — reusable components (Header, Footer, Chatbox, UI primitives)
	- `lib/` — utility functions
	- `pages/` — classic React pages (used in this project for navigation)

## Getting Started

Prerequisites:
- Node.js (>= 16 recommended)
- npm or pnpm

Install dependencies and run the dev server:

```bash
cd react-app
npm install
npm start
```

Open http://localhost:3000 in your browser.

## Build

```bash
npm run build
```

Build output will be placed in the `build/` folder.

## Cloud Formation Stack
## CloudFormation Stack

Deploy the DynamoDB infrastructure:

```bash
cd Dynamo/cloudformation

aws cloudformation create-stack \
  --stack-name restaurant-dynamodb-dev \
  --template-body file://dynamo-website-stack.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=dev \
  --region us-east-1
```

See [Dynamo/README.md](Dynamo/README.md) for complete infrastructure documentation and [Dynamo/docs/DEPLOYMENT-GUIDE.md](Dynamo/docs/DEPLOYMENT-GUIDE.md) for detailed deployment instructions.

## Linting & Formatting

This project includes ESLint settings via `react-scripts` and uses Tailwind CSS. Add project-specific linters or formatters if needed.

## Contributing

- Keep components small and focused.
- Place static assets in `public/` only when they must be served at a fixed URL. Otherwise, put images in `src/assets` and import them.


## License

Internal project — add a LICENSE file if you plan to open source this.
)

**
