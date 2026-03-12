API = localhost:300.


POST Endpoint '/spin'
Payload: {
    "bet":5,
    "sessionId": "b0ff18e8-6010-4aef-b769-53a31c53c549"
}
Samploe response: {
    "credits": 1011,
    "bet": 5,
    "reelsSymbols": [
        [
            "Wild",
            "Ten",
            "Scatter1",
            "Nine"
        ],
        [
            "Ten",
            "King",
            "Queen",
            "Scatter2"
        ],
        [
            "King",
            "Ten",
            "Queen",
            "Nine"
        ],
        [
            "Nine",
            "Nine",
            "Scatter1",
            "Ace"
        ],
        [
            "Scatter1",
            "Nine",
            "Jack",
            "Jack"
        ]
    ],
    "winningLines": {
        "8": {
            "definition": [
                0,
                0,
                1,
                2,
                2
            ],
            "pattern": [
                1,
                1,
                1,
                0,
                0
            ],
            "symbolId": "Ten",
            "lineId": "8",
            "symbolsPositions": [
                0,
                1,
                2
            ],
            "wildSymbolsPositions": [
                0
            ],
            "winAmount": 1
        },
        "12": {
            "definition": [
                0,
                1,
                0,
                1,
                0
            ],
            "pattern": [
                1,
                1,
                1,
                0,
                0
            ],
            "symbolId": "King",
            "lineId": "12",
            "symbolsPositions": [
                0,
                1,
                2
            ],
            "wildSymbolsPositions": [
                0
            ],
            "winAmount": 4
        },
        "15": {
            "definition": [
                1,
                0,
                1,
                0,
                1
            ],
            "pattern": [
                1,
                1,
                1,
                0,
                0
            ],
            "symbolId": "Ten",
            "lineId": "15",
            "symbolsPositions": [
                0,
                1,
                2
            ],
            "wildSymbolsPositions": [],
            "winAmount": 1
        }
    },
    "winningScatters": {
        "Scatter1": {
            "symbolId": "Scatter1",
            "symbolsPositions": [
                [
                    0,
                    2
                ],
                [
                    3,
                    2
                ],
                [
                    4,
                    0
                ]
            ],
            "winAmount": 10
        }
    },
    "totalWin": 16,
    "freeGamesResult": {
        "triggeredFreeGames": true,
        "freeGamesSpins": [
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Ten",
                        "Nine",
                        "Ten",
                        "Queen"
                    ],
                    [
                        "Ten",
                        "Nine",
                        "Ten",
                        "Wild"
                    ],
                    [
                        "Wild",
                        "Wild",
                        "Queen",
                        "Ten"
                    ],
                    [
                        "Queen",
                        "Ten",
                        "King",
                        "Nine"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "Jack",
                        "Jack"
                    ]
                ],
                "winningLines": {
                    "0": {
                        "definition": [
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Ten",
                        "lineId": "0",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 2
                    },
                    "1": {
                        "definition": [
                            1,
                            1,
                            1,
                            1,
                            1
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "1",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 2
                    },
                    "8": {
                        "definition": [
                            0,
                            0,
                            1,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Ten",
                        "lineId": "8",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 2
                    },
                    "10": {
                        "definition": [
                            3,
                            3,
                            2,
                            1,
                            1
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Queen",
                        "lineId": "10",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            1
                        ],
                        "winAmount": 4
                    },
                    "11": {
                        "definition": [
                            2,
                            2,
                            1,
                            0,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Ten",
                        "lineId": "11",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 2
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Jack",
                        "Nine",
                        "Ten",
                        "Queen"
                    ],
                    [
                        "Queen",
                        "King",
                        "Ten",
                        "Queen"
                    ],
                    [
                        "Jack",
                        "Ace",
                        "King",
                        "Queen"
                    ],
                    [
                        "Queen",
                        "Jack",
                        "King",
                        "King"
                    ],
                    [
                        "King",
                        "Nine",
                        "Ten",
                        "Wild"
                    ]
                ],
                "winningLines": {
                    "3": {
                        "definition": [
                            3,
                            3,
                            3,
                            3,
                            3
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Queen",
                        "lineId": "3",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 4
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Nine",
                        "Jack",
                        "Ten",
                        "Nine"
                    ],
                    [
                        "Nine",
                        "Ten",
                        "Nine",
                        "Ten"
                    ],
                    [
                        "King",
                        "Jack",
                        "Queen",
                        "Jack"
                    ],
                    [
                        "Nine",
                        "Ace",
                        "Nine",
                        "Ten"
                    ],
                    [
                        "Wild",
                        "Queen",
                        "King",
                        "Queen"
                    ]
                ],
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Jack",
                        "Nine",
                        "Ten",
                        "Queen"
                    ],
                    [
                        "Queen",
                        "Ace",
                        "Ten",
                        "Nine"
                    ],
                    [
                        "Ten",
                        "Wild",
                        "Wild",
                        "Queen"
                    ],
                    [
                        "Ten",
                        "Nine",
                        "Wild",
                        "Jack"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "Jack",
                        "Jack"
                    ]
                ],
                "winningLines": {
                    "2": {
                        "definition": [
                            2,
                            2,
                            2,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            1,
                            0
                        ],
                        "symbolId": "Ten",
                        "lineId": "2",
                        "symbolsPositions": [
                            0,
                            1,
                            2,
                            3
                        ],
                        "wildSymbolsPositions": [
                            2,
                            3
                        ],
                        "winAmount": 4
                    },
                    "11": {
                        "definition": [
                            2,
                            2,
                            1,
                            0,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            1,
                            0
                        ],
                        "symbolId": "Ten",
                        "lineId": "11",
                        "symbolsPositions": [
                            0,
                            1,
                            2,
                            3
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 4
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Wild",
                        "Jack",
                        "Nine",
                        "Ten"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "Nine",
                        "Ten"
                    ],
                    [
                        "Nine",
                        "Ten",
                        "Nine",
                        "Ace"
                    ],
                    [
                        "Nine",
                        "Ten",
                        "Queen",
                        "Ten"
                    ],
                    [
                        "Queen",
                        "King",
                        "Queen",
                        "Ten"
                    ]
                ],
                "winningLines": {
                    "2": {
                        "definition": [
                            2,
                            2,
                            2,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "2",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 2
                    },
                    "4": {
                        "definition": [
                            0,
                            1,
                            2,
                            1,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "4",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            0
                        ],
                        "winAmount": 2
                    },
                    "7": {
                        "definition": [
                            2,
                            1,
                            0,
                            1,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "7",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 2
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Queen",
                        "Jack",
                        "King",
                        "Ace"
                    ],
                    [
                        "Nine",
                        "King",
                        "King",
                        "Jack"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "King",
                        "Jack"
                    ],
                    [
                        "Nine",
                        "Ten",
                        "Queen",
                        "Ten"
                    ],
                    [
                        "Wild",
                        "King",
                        "Nine",
                        "Ten"
                    ]
                ],
                "winningLines": {
                    "2": {
                        "definition": [
                            2,
                            2,
                            2,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "King",
                        "lineId": "2",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 8
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "King",
                        "Queen",
                        "Jack",
                        "King"
                    ],
                    [
                        "Nine",
                        "King",
                        "King",
                        "Jack"
                    ],
                    [
                        "Ten",
                        "Wild",
                        "Wild",
                        "Queen"
                    ],
                    [
                        "Jack",
                        "Ten",
                        "Ten",
                        "Ten"
                    ],
                    [
                        "Queen",
                        "Ten",
                        "Jack",
                        "Nine"
                    ]
                ],
                "winningLines": {
                    "4": {
                        "definition": [
                            0,
                            1,
                            2,
                            1,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "King",
                        "lineId": "4",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 8
                    },
                    "6": {
                        "definition": [
                            3,
                            2,
                            1,
                            2,
                            3
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "King",
                        "lineId": "6",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            2
                        ],
                        "winAmount": 8
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Nine",
                        "Jack",
                        "Ten",
                        "Nine"
                    ],
                    [
                        "Nine",
                        "Jack",
                        "Nine",
                        "Nine"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "Ten",
                        "Nine"
                    ],
                    [
                        "Ten",
                        "King",
                        "Nine",
                        "Jack"
                    ],
                    [
                        "Queen",
                        "Ten",
                        "Ten",
                        "Ten"
                    ]
                ],
                "winningLines": {
                    "3": {
                        "definition": [
                            3,
                            3,
                            3,
                            3,
                            3
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "3",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 2
                    },
                    "6": {
                        "definition": [
                            3,
                            2,
                            1,
                            2,
                            3
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            1,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "6",
                        "symbolsPositions": [
                            0,
                            1,
                            2,
                            3
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 4
                    },
                    "8": {
                        "definition": [
                            0,
                            0,
                            1,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            1,
                            0
                        ],
                        "symbolId": "Nine",
                        "lineId": "8",
                        "symbolsPositions": [
                            0,
                            1,
                            2,
                            3
                        ],
                        "wildSymbolsPositions": [],
                        "winAmount": 4
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Wild",
                        "Queen",
                        "Jack",
                        "Ace"
                    ],
                    [
                        "Wild",
                        "Jack",
                        "Nine",
                        "King"
                    ],
                    [
                        "Ace",
                        "Wild",
                        "Ten",
                        "Wild"
                    ],
                    [
                        "Jack",
                        "Queen",
                        "Jack",
                        "King"
                    ],
                    [
                        "Ten",
                        "Ten",
                        "King",
                        "Ace"
                    ]
                ],
                "winningLines": {
                    "0": {
                        "definition": [
                            0,
                            0,
                            0,
                            0,
                            0
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            0,
                            0
                        ],
                        "symbolId": "Ace",
                        "lineId": "0",
                        "symbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "wildSymbolsPositions": [
                            0,
                            1
                        ],
                        "winAmount": 10
                    },
                    "8": {
                        "definition": [
                            0,
                            0,
                            1,
                            2,
                            2
                        ],
                        "pattern": [
                            1,
                            1,
                            1,
                            1,
                            0
                        ],
                        "symbolId": "Jack",
                        "lineId": "8",
                        "symbolsPositions": [
                            0,
                            1,
                            2,
                            3
                        ],
                        "wildSymbolsPositions": [
                            0,
                            1,
                            2
                        ],
                        "winAmount": 8
                    }
                },
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            },
            {
                "credits": null,
                "bet": 5,
                "reelsSymbols": [
                    [
                        "Wild",
                        "Jack",
                        "Nine",
                        "Ten"
                    ],
                    [
                        "Queen",
                        "King",
                        "Ten",
                        "Queen"
                    ],
                    [
                        "King",
                        "Jack",
                        "Queen",
                        "Jack"
                    ],
                    [
                        "Queen",
                        "Ten",
                        "King",
                        "Nine"
                    ],
                    [
                        "Jack",
                        "Nine",
                        "Jack",
                        "Jack"
                    ]
                ],
                "freeGamesNum": 0,
                "freeGamesSum": 0,
                "freeGamesBank": 0,
                "wonFreeGamesNumber": 0
            }
        ],
        "freeGamesTotalWin": 82,
        "numberOfFreeSpins": 10,
        "totalWinRound": 8
    }
}