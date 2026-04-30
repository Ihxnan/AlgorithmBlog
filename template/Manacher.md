# [Manacher](https://www.luogu.com.cn/problem/P3805)

### 注: string末尾也会自动添加‘\0’

```cpp
#include <iostream>
#include <vector>

using namespace std;

int main()
{
    string tmp;
    cin >> tmp;
    string str = "^#";
    for (auto &p : tmp)
        str += p, str += '#';
    vector<int> p(str.size());
    int ans = 0;
    for (int i = 1, r = 1, mid = 0; i < str.size() - 1; ++i)
    {
        if (i < r)
            p[i] = min(p[2 * mid - i], r - i);
        while (str[i - p[i]] == str[i + p[i]])
            ++p[i];
        if (i + p[i] > r)
            r = i + p[i], mid = i;
        ans = max(ans, p[i] - 1);
    }
    cout << ans << endl;
    
}
```

