import type {Metadata} from 'next';
import ManageBooking from './view';
export const metadata:Metadata={title:'Meu agendamento | Duu Jato',robots:{index:false,follow:false}};
export default function Page(){return <ManageBooking/>}
