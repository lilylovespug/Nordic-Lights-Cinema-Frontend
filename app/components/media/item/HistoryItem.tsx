import { Card, CardBody } from '@nextui-org/card';
import { Progress } from '@nextui-org/progress';
import { Link } from '@remix-run/react';
import { MimeType } from 'remix-image';

import { getSessionFromCookie, type IHistory } from '~/services/supabase';
import Image from '~/components/elements/Image';
import notFound from '~/assets/images/404.gif';
import { Button } from '@nextui-org/button';

interface IHistoryItem {
  item: IHistory;
  jwt: string
}

const cancelOrder = async (order: any, jwt: string) => {

  const cancelStatus = 3;
  const orderId = order.id;

  const url = `http://localhost:5000/api/orders/${orderId}/status?status=${cancelStatus}`;

  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
  };

  await fetch(url, options);
  alert('Cancel order successfully!');

  // Reload the current page
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const deleteOrder = async (order: any, jwt: string) => {
  if(!confirm('Are you sure to delete this order?')) return;

  const orderId = order.id;

  const url = `http://localhost:5000/api/orders/${orderId}`;

  const options = {
    method: 'Delete',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
  };

  await fetch(url, options);
  alert('Delete order successfully!');

   // Reload the current page
   if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const HistoryItem = ({ item, jwt }: IHistoryItem) => {


  const url = new URL(`http://abc${item?.route}`);
  if (item?.watched !== 0) {
    //url.searchParams.set('t', item.watched.toString());
  }

  return (
    // <Link to="" className="w-[304px] sm:w-full">
    <Card
      isPressable
      isHoverable
      className="data-[hover=true]:ring-2 data-[hover=true]:ring-focus sm:!max-h-[171px] sm:w-full"
    >
      <CardBody className="flex flex-col flex-nowrap justify-start overflow-hidden p-0 sm:flex-row">
        <Image
          width="304px"
          height="171px"
          src={item?.poster || notFound}
          alt={item?.title}
          title={item?.title}
          classNames={{
            wrapper: 'z-0 m-0 min-h-[171px] min-w-[304px] overflow-hidden',
          }}
          placeholder="empty"
          loading="lazy"
          options={{ contentType: MimeType.WEBP }}
          responsive={[{ size: { width: 304, height: 171 } }]}
        />
        <div className="flex flex-col justify-start p-3">
          <h4 className="line-clamp-1">{item?.title}</h4>
          {item?.season ? <p>SS {item.season}&ensp;-&ensp;</p> : null}
          {item?.episode ? <p>EP {item.episode.split('-').at(-1)}</p> : null}
          <p>{new Date(item?.updated_at.toString()).toLocaleString()}</p>
          {
            (item as any).status !== 3 ? (
              <Button
                type="button"
                color="warning"
                size="md"
                onPress={async () => await cancelOrder(item, jwt)}
                className="w-48"
              >
                Cancel
              </Button>
            ) : <Button
              type="button"
              color="danger"
              size="md"
              onPress={async () => await deleteOrder(item, jwt)}
              className="w-48"
            >
              Delete
            </Button>
          }

        </div>
      </CardBody>
    </Card>


    // </Link>
  );
};

export default HistoryItem;
