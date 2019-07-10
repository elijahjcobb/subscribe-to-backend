# subscribe-to-backend
backend: [Elijah Cobb](https://github.com/elijahjcobb)

frontend:[Trevor Sears](https://github.com/T99)

# Security Practices

## User Passwords
User passwords are salted and stored after going through a hashing iterator 1000 times.
They are hashed using the `sha256` hashing algorithm. At no time will a user's password ever be
stored in plain text. The only time the server ever returns the user's password is during the
sign up process when it encrypts the user's password with a shared private secret to provide
a stateless environment for account registration while verifying the new user's email account.
However the password is already salted and it is encrypted using the `aes-256-cbc` encryption
standard.

## Permissions
All user interactions are done using a token. The token is an identifier for a session
object that is retained in a state based environment by the server. On most endpoints, you are
required to specify a token. Simply follow the `bearer` style.

For the header `Authorization` simply provide a value of `Bearer X` where `X` is the token
provided to you by the server.

# Object Structures

## User
| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `firstName` | `string` | X | The user's first name. |
| `lastName` | `string` | X | The user's last name. |
| `email` | `string` | - | The user's email address. |
| `phone` | `string` | X | The user's phone number. |
| `gender` | `UserGender` | X | The user's gender. |
| `birthday` | `string` | X | The user's birthday with format `mmddyyyy`. |
| `id` | `string` | - | The user's identifier. |
| `updatedAt` | `number` | - | The number of milliseconds after 1970 the user was last updated. |
| `createdAt` | `number` | - | The number of milliseconds after 1970 the user was created. |

#### UserGender
| Index | Description |
| --- | --- |
| `0` | male |
| `1` | female |
| `2` | other |

## Business
| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | The business's name. |
| `lat` | `number` | - | The business's latitude. |
| `lng` | `number` | - | The business's longitude. |
| `id` | `string` | - | The business's identifier. |
| `updatedAt` | `number` | - | The number of milliseconds after 1970 the business was last updated. |
| `createdAt` | `number` | - | The number of milliseconds after 1970 the business was created. |

## Product
| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | The product's name. |
| `description` | `string` | - | The product's description. |
| `businessId` | `string` | - | The id of the business the product belongs to. |
| `id` | `string` | - | The product's identifier. |
| `updatedAt` | `number` | - | The number of milliseconds after 1970 the product was last updated. |
| `createdAt` | `number` | - | The number of milliseconds after 1970 the product was created. |

## Program
| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `productId` | `string` | - | The id of the product the program is for. |
| `businessId` | `string` | - | The id of the business the program belongs to. |
| `price` | `number` | - | The price of the program every month in pennies. |
| `allowance` | `number` | - | The amount of times the subscription can be used per month. |
| `successorId` | `string` | X | The id of the successor to this program if there is one. |
| `closed` | `boolean` | - | Whether or not the program is allowing any new subscriptions. |
| `updatedAt` | `number` | - | The number of milliseconds after 1970 the program was last updated. |
| `createdAt` | `number` | - | The number of milliseconds after 1970 the program was created. |

## Subscription
| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `userId` | `string` | - | The id of the user that uses the subscription. |
| `businessId` | `string` | - | The if of the business that provides the subscription. |
| `programId` | `string` | - | The id of the program the subscription if for. |
| `autoRenew` | `boolean` | - | Whether the subscription should auto-renew at the end of the month. |
| `id` | `string` | - | The product's identifier. |
| `updatedAt` | `number` | - | The number of milliseconds after 1970 the product was last updated. |
| `createdAt` | `number` | - | The number of milliseconds after 1970 the product was created. |
