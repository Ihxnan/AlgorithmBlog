// https://ac.nowcoder.com/acm/contest/126120/F
#include "../template.cpp"

void init()
{
    cin >> t; // 输入测试用例个数
}

void solve()
{
    int n;      // 字符串长度
    string str; // 字符串
    cin >> n >> str;
    vi arr(n); // 代价数组
    cin >> arr;

    vvl dp(n, vl(n, lINF)); // dp[i][j] 表示从 i 到 j 的最小代价

    // 边界情况(只有两个字符)
    for (int i = 0; i < n - 1; ++i)
        if (str[i] == str[i + 1])               // 如果两个字符相同
            dp[i][i + 1] = arr[i] * arr[i + 1]; // 连接两个字符的代价为arr[i]*arr[i+1]

    // 区间长度肯定为偶数
    for (int len = 4; len <= n; len += 2)     // 枚举区间长度
        for (int l = 0; l + len - 1 < n; ++l) // 枚举左端点
        {
            int r = l + len - 1; // 右端点

            // 以l为起点考虑连接l和其他所有点的情况，取最小值
            for (int i = l + 1; i < r; i += 2) // 连接l和l+1 ~ r-2
                dp[l][r] = min(dp[l][r], dp[l][i] + dp[i + 1][r]);

            if (str[l] == str[r]) // 如果l和r字符相同，考虑连接l和r的情况
                dp[l][r] = min(dp[l][r], arr[l] * arr[r] + dp[l + 1][r - 1]);
        }

    // dp[0][n-1] 表示从 0 到 n-1 的最小代价
    cout << (dp[0][n - 1] == lINF ? -1 : dp[0][n - 1]) << endl;
}
