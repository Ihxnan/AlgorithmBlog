// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805122985476096
#include "../../template.cpp"

void init()
{
    t = 1;
}

int weight[] = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
char arr[] = {'1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'};

void solve()
{
    int n;
    cin >> n;
    int cnt = 0;
    for (int i = 0; i < n; ++i)
    {
        string str;
        cin >> str;
        int sum = 0;
        for (int j = 0; j < 17; ++j)
            sum += (str[j] - '0') * weight[j];
        if (str.back() != arr[sum % 11])
            cout << str << endl;
        else
            ++cnt;
    }
    if (cnt == n)
        cout << "All passed" << endl;
}
