'use client';

import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { BACKEND_BASE } from '../config';

// Global singleton client to ensure only one connection is opened
let stompClient = null;
const listeners = new Set();
let isConnecting = false;
let isConnected = false;

function getWsUrl() {
    if (BACKEND_BASE) {
        return BACKEND_BASE.replace(/^http/, 'ws') + '/ws';
    }
    if (typeof window !== 'undefined') {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        return `${proto}://${window.location.host}/xformwms/ws`;
    }
    return '';
}

function getHttpUrl() {
    if (BACKEND_BASE) {
        return BACKEND_BASE + '/ws';
    }
    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.host}/xformwms/ws`;
    }
    return '';
}

function initStompClient() {
    if (stompClient || isConnecting) return;

    isConnecting = true;
    const httpUrl = getHttpUrl();

    stompClient = new Client({
        brokerURL: getWsUrl(),
        webSocketFactory: () => new SockJS(httpUrl),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
            isConnected = true;
            isConnecting = false;
            listeners.forEach((l) => l.onStatusChange(true));
            // Re-subscribe all active listeners on reconnect
            listeners.forEach((l) => {
                if (l.topic && !l.subscription) {
                    l.subscription = stompClient.subscribe(l.topic, (message) => {
                        try {
                            const parsed = JSON.parse(message.body);
                            l.callback(parsed);
                        } catch (e) {
                            l.callback(message.body);
                        }
                    });
                }
            });
        },
        onDisconnect: () => {
            isConnected = false;
            isConnecting = false;
            listeners.forEach((l) => l.onStatusChange(false));
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        },
        onWebSocketClose: () => {
            isConnected = false;
            isConnecting = false;
            listeners.forEach((l) => l.onStatusChange(false));
        }
    });

    stompClient.activate();
}

export function useWebSocketSubscription(topic, onMessage) {
    const [connected, setConnected] = useState(isConnected);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        initStompClient();

        const listenerObj = {
            topic,
            callback: onMessage,
            subscription: null,
            onStatusChange: (status) => setConnected(status),
        };

        listeners.add(listenerObj);

        // If client is already connected, subscribe immediately
        if (stompClient && stompClient.connected && topic) {
            listenerObj.subscription = stompClient.subscribe(topic, (message) => {
                try {
                    const parsed = JSON.parse(message.body);
                    onMessage(parsed);
                } catch (e) {
                    onMessage(message.body);
                }
            });
        }

        return () => {
            listeners.delete(listenerObj);
            if (listenerObj.subscription) {
                listenerObj.subscription.unsubscribe();
            }
        };
    }, [topic, onMessage]);

    return { connected };
}

export function getWebSocketStatus() {
    return isConnected;
}
