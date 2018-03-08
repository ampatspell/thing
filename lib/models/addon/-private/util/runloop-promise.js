import { Promise } from 'rsvp';
import { schedule, next as next_ } from '@ember/runloop';

export const afterRender = () => new Promise(resolve => schedule('afterRender', () => resolve()));
export const next = () => new Promise(resolve => next_(() => resolve()));
