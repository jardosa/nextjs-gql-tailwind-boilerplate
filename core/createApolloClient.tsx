import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
  from
} from '@apollo/client';
import { ErrorResponse, onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

import { createUploadLink } from 'apollo-upload-client';
import { useMemo } from 'react';
import { NextPageContext } from 'next';
import Cookies from 'js-cookie';

let apolloClient: ApolloClient<NormalizedCacheObject>;

let graphqlUrl: string | undefined;
if (typeof window) {
  graphqlUrl = process.env.NEXT_PUBLIC_EXTERNAL_GRAPHQL_URL;
} else {
  graphqlUrl = process.env.INTERNAL_GRAPHQL_URL;
}

const createApolloClient = (ctx?: NextPageContext) => {
  const errorLink: ApolloLink = onError((errorResponse: ErrorResponse) => {
    const { operation, forward, graphQLErrors, networkError } = errorResponse;
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        // eslint-disable-next-line no-console
        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
      );
    }
    if (networkError && 'statusCode' in networkError && networkError.statusCode === 404) {
      operation.setContext({ headers: {} });
      return forward(operation);
    }
  });

  const authLink = setContext(() => {
    let access_token: string | undefined = '';
    if (typeof window) {
      access_token = Cookies.get('access_token');
    }

    if (access_token) {
      return { headers: { authorization: `Bearer ${access_token}` } };
    }
    return { headers: {} };
  });

  const uploadLink = createUploadLink({
    uri: graphqlUrl
  });

  return new ApolloClient({
    credentials: 'include',
    ssrMode: typeof window === 'undefined', // set to true for SSR
    link: from([authLink, errorLink, uploadLink]),
    cache: new InMemoryCache()
  });
};

/* eslint-disable no-underscore-dangle */
export function initializeApollo(initialState: any = null, ctx?: NextPageContext) {
  const _apolloClient = apolloClient ?? createApolloClient(ctx);

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState: any) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
