# Example: 3x3 matrix multiplication
A = [[12, 7, 3],
     [4 , 5, 6],
     [7 , 8, 9]]

B = [[5, 8, 1],
     [6, 7, 3],
     [4, 5, 9]]

# Pre-allocate a result matrix with zeros
result = [[0 for _ in range(len(B[0]))] for _ in range(len(A))]

# Standard multiplication algorithm
for i in range(len(A)):           # Iterate through rows of A
    for j in range(len(B[0])):    # Iterate through columns of B
        for k in range(len(B)):   # Iterate through rows of B
            result[i][j] += A[i][k] * B[k][j]

for r in result:
    print(r)
