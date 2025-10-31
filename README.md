# VATSIM Germany Piloten-Mentoren-Programm (PMP)

Das **Piloten-Mentoren-Programm** dient als Anlaufstelle für neue Piloten von VATSIM-Germany, also des deutschen vACC. Wir helfen unseren Trainees "Fit for online flying" zu werden, Ziel ist also das Erlernen der Netzwerkprozeduren sowie der sichere Lotsenkontakt und weniger das handwerkliche am Fliegen, welches zumindest Grundlegend vorrausgesetzt wird. 

Die neue Website soll zunächst ersteinmal visuell ansprechender sein als die Knowledgebase und später auch die Anmeldung für das PMP und die interne Organisation aus dem Forum auslagern. Ziel ist es, eine Adresse zu haben, am die sich unerfahrene Piloten wenden können, auf die zum Beispiel auch ein EuroScope Alias verweisen könnte, zum Beispiel `.helppmp` statt dem bisherigen `.helpnewbie`.

## Running the Application

Development:

1. Run `npm install`
2. Run `npm run dev`

Alternatively, you can build the project using Docker.

Production:

1. Pull the latest docker image `docker pull ghcr.io/vatger/pilot-mentoring-programme:latest`
2. Start the container, default port 8000: `docker start pilot-mentoring-programme`


## Contact

- Jacob Koglin (1893789)

### Phase 1: Foundation (Current)
- [x] Basic website structure
- [x] Core information pages
- [x] Mobile-responsive design
- [x] Dark/light mode

### Phase 2: Enhanced Features (Next)
- [ ] Signup System via VATSIM-Germany SSO
- [ ] Move PMP-Signup from Forum to website

## Development Tasks
- [ ] Implement styling for/and forms
- [ ] Create proper 404 and error pages
- [x] Add analytics for usage tracking
