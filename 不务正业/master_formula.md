# Master 公式

$$
T(n) = a * T(n / b) + O(n ^ c)
$$

1.   如果$\log_b a < c$，时间复杂度为 $O(n^c)$
2.   如果$\log_b a > c$，时间复杂度为$O(n^{\log_b a})$
3.   如果$\log_b a = c$，时间复杂度为$O(n^c * \log n)$
4.   $T(n) = 2 * T(n / 2) + O(n * \log n)$的时间复杂度为$O(n * \log^2 n)$