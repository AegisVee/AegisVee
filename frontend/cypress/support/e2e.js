// Import commands.js using ES2015 syntax:
import './commands'
import "cypress-real-events/support";
import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';

addMatchImageSnapshotCommand();
