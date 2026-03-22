// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805103557459968
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vector<pair<int, string>> arr(n);
    for (auto &[gender, name] : arr)
        cin >> gender >> name;
    vb sta(n);
    for (int i = 0; i < n / 2; ++i)
    {
        cout << arr[i].second << " ";
        for (int j = n - 1;; --j)
            if (!sta[j] && arr[j].first != arr[i].first)
            {
                cout << arr[j].second << endl, sta[j] = 1;
                break;
            }
    }
}
